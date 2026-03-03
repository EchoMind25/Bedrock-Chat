/**
 * Discord GDPR Export Parser
 *
 * Parses the Discord data export ZIP that users get from:
 * Discord Settings → Privacy & Safety → Request All of My Data
 *
 * PRIVACY CRITICAL:
 * - We ONLY extract `servers/index.json` (server names + IDs)
 * - We NEVER read account/, messages/, or activity/ directories
 * - The ZIP file is processed entirely client-side; nothing is uploaded
 * - After parsing, the File reference is released
 *
 * The Discord GDPR export does NOT contain server structure (channels, roles).
 * It only lists servers the user belongs to. The user must manually enter
 * channels and roles via the guided form.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface DiscordServerEntry {
  /** Discord server ID (snowflake) */
  id: string;
  /** Server name as it appears in Discord */
  name: string;
}

export interface DiscordExportResult {
  success: boolean;
  servers: DiscordServerEntry[];
  error?: string;
}

// ---------------------------------------------------------------------------
// ZIP parsing (minimal, no external dependency)
// ---------------------------------------------------------------------------

/**
 * Reads a specific file from a ZIP archive.
 * Uses the browser's built-in DecompressionStream API.
 *
 * ZIP local file header structure:
 * - 4 bytes: signature (0x04034b50)
 * - 2 bytes: version needed
 * - 2 bytes: general purpose bit flag
 * - 2 bytes: compression method (0=stored, 8=deflate)
 * - 4 bytes: last mod time
 * - 4 bytes: CRC-32
 * - 4 bytes: compressed size
 * - 4 bytes: uncompressed size
 * - 2 bytes: filename length
 * - 2 bytes: extra field length
 * - n bytes: filename
 * - n bytes: extra field
 * - n bytes: file data
 */
async function readFileFromZip(
  zipFile: File,
  targetPath: string,
): Promise<string | null> {
  const buffer = await zipFile.arrayBuffer();
  const view = new DataView(buffer);
  let offset = 0;

  while (offset < buffer.byteLength - 4) {
    // Check for local file header signature
    const signature = view.getUint32(offset, true);
    if (signature !== 0x04034b50) break;

    const compressionMethod = view.getUint16(offset + 8, true);
    const compressedSize = view.getUint32(offset + 18, true);
    const filenameLength = view.getUint16(offset + 26, true);
    const extraLength = view.getUint16(offset + 28, true);

    const filenameBytes = new Uint8Array(
      buffer,
      offset + 30,
      filenameLength,
    );
    const filename = new TextDecoder().decode(filenameBytes);

    const dataOffset = offset + 30 + filenameLength + extraLength;

    // Normalize path comparison (handle leading ./ or /)
    const normalizedFilename = filename
      .replace(/^\.\//, "")
      .replace(/^\//, "");
    const normalizedTarget = targetPath
      .replace(/^\.\//, "")
      .replace(/^\//, "");

    if (normalizedFilename === normalizedTarget) {
      const compressedData = new Uint8Array(buffer, dataOffset, compressedSize);

      if (compressionMethod === 0) {
        // Stored (no compression)
        return new TextDecoder().decode(compressedData);
      } else if (compressionMethod === 8) {
        // Deflate — use DecompressionStream
        try {
          const ds = new DecompressionStream("deflate-raw");
          const writer = ds.writable.getWriter();
          writer.write(compressedData);
          writer.close();

          const reader = ds.readable.getReader();
          const chunks: Uint8Array[] = [];
          let done = false;
          while (!done) {
            const result = await reader.read();
            if (result.value) chunks.push(result.value);
            done = result.done;
          }

          const totalLength = chunks.reduce((sum, c) => sum + c.length, 0);
          const merged = new Uint8Array(totalLength);
          let pos = 0;
          for (const chunk of chunks) {
            merged.set(chunk, pos);
            pos += chunk.length;
          }
          return new TextDecoder().decode(merged);
        } catch {
          return null;
        }
      }
    }

    offset = dataOffset + compressedSize;
  }

  return null;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Parses a Discord GDPR data export ZIP file and extracts server names.
 *
 * ONLY reads `servers/index.json`. All other data is ignored.
 *
 * @param file The ZIP file from the user's file input
 * @returns List of Discord servers the user belongs to
 */
export async function parseDiscordExport(
  file: File,
): Promise<DiscordExportResult> {
  // Validate file type
  if (
    !file.name.endsWith(".zip") &&
    file.type !== "application/zip" &&
    file.type !== "application/x-zip-compressed"
  ) {
    return {
      success: false,
      servers: [],
      error:
        "Please upload a ZIP file. Discord data exports come as a .zip file.",
    };
  }

  // Size limit: 500MB (Discord exports can be large with messages)
  const MAX_ZIP_SIZE = 500 * 1024 * 1024;
  if (file.size > MAX_ZIP_SIZE) {
    return {
      success: false,
      servers: [],
      error:
        "File is too large (max 500MB). This might not be a Discord data export.",
    };
  }

  try {
    // Try multiple possible paths for the servers index
    const possiblePaths = [
      "servers/index.json",
      "package/servers/index.json",
    ];

    let content: string | null = null;
    for (const path of possiblePaths) {
      content = await readFileFromZip(file, path);
      if (content) break;
    }

    if (!content) {
      return {
        success: false,
        servers: [],
        error:
          "Could not find servers/index.json in the ZIP file. Make sure this is a Discord data export (Settings > Privacy & Safety > Request All of My Data).",
      };
    }

    // Parse the servers index
    const parsed: unknown = JSON.parse(content);

    // Discord's servers/index.json format: { "server_id": "Server Name", ... }
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
      return {
        success: false,
        servers: [],
        error:
          "The servers/index.json file has an unexpected format. It should be a JSON object mapping server IDs to names.",
      };
    }

    const servers: DiscordServerEntry[] = [];
    for (const [id, name] of Object.entries(parsed as Record<string, unknown>)) {
      if (typeof name === "string") {
        servers.push({ id, name: name.trim() });
      }
    }

    if (servers.length === 0) {
      return {
        success: false,
        servers: [],
        error:
          "No servers found in your Discord export. You may not be a member of any servers.",
      };
    }

    // Sort alphabetically
    servers.sort((a, b) => a.name.localeCompare(b.name));

    return {
      success: true,
      servers,
    };
  } catch {
    return {
      success: false,
      servers: [],
      error:
        "Failed to read the ZIP file. Please make sure it's a valid Discord data export.",
    };
  }
}
