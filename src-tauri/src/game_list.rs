//! Curated allowlist of known game process names.
//!
//! Only processes matching this list are reported as game activity.
//! This ensures we never leak arbitrary process information.
//! Names are stored lowercase for case-insensitive matching.

/// Check if a process filename matches a known game or game launcher.
///
/// Matching is case-insensitive and checks the filename only (no path).
pub fn is_known_game(filename: &str) -> Option<&'static str> {
    let lower = filename.to_lowercase();
    // Strip .exe suffix for matching (handles Windows executables on all platforms)
    let stem = lower.strip_suffix(".exe").unwrap_or(&lower);

    GAME_LIST.iter().find_map(|(process_name, display_name)| {
        if stem == *process_name {
            Some(*display_name)
        } else {
            None
        }
    })
}

/// (process_stem, display_name) pairs.
/// Process stem is lowercase, without .exe extension.
static GAME_LIST: &[(&str, &str)] = &[
    // --- Game Launchers ---
    ("steam", "Steam"),
    ("steamwebhelper", "Steam"),
    ("epicgameslauncher", "Epic Games"),
    ("galaxyclient", "GOG Galaxy"),
    ("battlenet", "Battle.net"),
    ("origin", "EA App"),
    ("eadesktop", "EA App"),
    ("ubisoftconnect", "Ubisoft Connect"),
    ("riotclientservices", "Riot Client"),
    // --- Popular Games ---
    ("valorant", "VALORANT"),
    ("valorant-win64-shipping", "VALORANT"),
    ("leagueclient", "League of Legends"),
    ("league of legends", "League of Legends"),
    ("fortnite", "Fortnite"),
    ("fortniteclient-win64-shipping", "Fortnite"),
    ("csgo", "Counter-Strike"),
    ("cs2", "Counter-Strike 2"),
    ("dota2", "Dota 2"),
    ("overwatch", "Overwatch 2"),
    ("overwatch2", "Overwatch 2"),
    ("minecraft", "Minecraft"),
    ("javaw", "Minecraft"), // Minecraft Java edition
    ("minecraftlauncher", "Minecraft"),
    ("robloxplayerbeta", "Roblox"),
    ("robloxplayer", "Roblox"),
    ("genshinimpact", "Genshin Impact"),
    ("yuanshen", "Genshin Impact"),
    ("starrailbase", "Honkai: Star Rail"),
    ("apexlegends", "Apex Legends"),
    ("r5apex", "Apex Legends"),
    ("destiny2", "Destiny 2"),
    ("eldenring", "Elden Ring"),
    ("baldursgate3", "Baldur's Gate 3"),
    ("bg3", "Baldur's Gate 3"),
    ("hogwartslegacy", "Hogwarts Legacy"),
    ("cyberpunk2077", "Cyberpunk 2077"),
    ("gtav", "GTA V"),
    ("gta5", "GTA V"),
    ("rdr2", "Red Dead Redemption 2"),
    ("terraria", "Terraria"),
    ("starfield", "Starfield"),
    ("palworld", "Palworld"),
    ("helldivers2", "Helldivers 2"),
    ("lethalcompany", "Lethal Company"),
    ("amongus", "Among Us"),
    ("fallguys_client", "Fall Guys"),
    ("deadbydaylight-win64-shipping", "Dead by Daylight"),
    ("phasmophobia", "Phasmophobia"),
    ("raft", "Raft"),
    ("stardewvalley", "Stardew Valley"),
    ("hollowknight", "Hollow Knight"),
    ("celeste", "Celeste"),
    ("hades", "Hades"),
    ("hades2", "Hades II"),
    ("thewitcher3", "The Witcher 3"),
    ("witcher3", "The Witcher 3"),
    ("warframe", "Warframe"),
    ("warframe.x64", "Warframe"),
    ("pathofexile", "Path of Exile"),
    ("pathofexile_x64", "Path of Exile"),
    ("diablo iv", "Diablo IV"),
    ("worldofwarcraft", "World of Warcraft"),
    ("wow", "World of Warcraft"),
    ("ffxiv", "Final Fantasy XIV"),
    ("ffxiv_dx11", "Final Fantasy XIV"),
    ("hearthstone", "Hearthstone"),
    ("rust", "Rust (Game)"),
    ("rustclient", "Rust (Game)"),
    ("ark", "ARK: Survival"),
    ("arkascended", "ARK: Survival Ascended"),
    ("rocketleague", "Rocket League"),
    ("pubg", "PUBG"),
    ("tslgame", "PUBG"),
    ("seaofthieves", "Sea of Thieves"),
    ("nomanssky", "No Man's Sky"),
    ("satisfactory", "Satisfactory"),
    ("factorio", "Factorio"),
    ("deeprock", "Deep Rock Galactic"),
    ("fsd-win64-shipping", "Deep Rock Galactic"),
];

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_exact_match() {
        assert_eq!(is_known_game("valorant"), Some("VALORANT"));
    }

    #[test]
    fn test_case_insensitive() {
        assert_eq!(is_known_game("VALORANT"), Some("VALORANT"));
        assert_eq!(is_known_game("Minecraft"), Some("Minecraft"));
    }

    #[test]
    fn test_exe_extension() {
        assert_eq!(is_known_game("valorant.exe"), Some("VALORANT"));
        assert_eq!(is_known_game("Steam.exe"), Some("Steam"));
    }

    #[test]
    fn test_unknown_process() {
        assert_eq!(is_known_game("chrome"), None);
        assert_eq!(is_known_game("code.exe"), None);
    }
}
