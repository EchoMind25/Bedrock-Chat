import { createClient } from "./client";
import { DEFAULT_CATEGORIES, DEFAULT_CATEGORY_POSITIONS } from "../constants/categories";

/**
 * Creates default channel categories for a new server.
 * This should be called when a server is first created.
 *
 * @param serverId - The ID of the server to create categories for
 * @returns Promise that resolves when categories are created
 */
export async function createDefaultCategories(serverId: string): Promise<void> {
	const supabase = createClient();

	const categories = [
		{
			server_id: serverId,
			name: DEFAULT_CATEGORIES.INFORMATION,
			position: DEFAULT_CATEGORY_POSITIONS.INFORMATION,
		},
		{
			server_id: serverId,
			name: DEFAULT_CATEGORIES.TEXT_CHANNELS,
			position: DEFAULT_CATEGORY_POSITIONS.TEXT_CHANNELS,
		},
		{
			server_id: serverId,
			name: DEFAULT_CATEGORIES.VOICE_CHANNELS,
			position: DEFAULT_CATEGORY_POSITIONS.VOICE_CHANNELS,
		},
	];

	const { error } = await supabase.from("channel_categories").insert(categories);

	if (error) {
		console.error("Error creating default categories:", error);
		throw error;
	}
}

/**
 * Sets up a new server with default categories and initial channel.
 * Call this after creating a server to initialize its structure.
 *
 * @param serverId - The ID of the newly created server
 * @param welcomeChannelName - Optional name for the welcome channel (defaults to "general")
 */
export async function setupNewServer(
	serverId: string,
	welcomeChannelName: string = "general"
): Promise<void> {
	const supabase = createClient();

	try {
		// Create default categories
		await createDefaultCategories(serverId);

		// Get the Text Channels category ID
		const { data: categories } = await supabase
			.from("channel_categories")
			.select("id, name")
			.eq("server_id", serverId)
			.eq("name", DEFAULT_CATEGORIES.TEXT_CHANNELS)
			.single();

		// Create a welcome channel in the Text Channels category
		if (categories) {
			await supabase.from("channels").insert({
				server_id: serverId,
				category_id: categories.id,
				name: welcomeChannelName,
				type: "text",
				position: 0,
			});
		}
	} catch (error) {
		console.error("Error setting up new server:", error);
		throw error;
	}
}
