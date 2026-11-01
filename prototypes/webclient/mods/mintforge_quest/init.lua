-- MINTforge-Quest-Mod (Prototyp für den Luanti-Web-Client)
--
-- Was sie zeigt:
--   * Anmeldung mit kurzlebigem Token statt Passwort (anmeldung.lua, token.lua)
--   * eine Beispiel-Quest „Zaun um 24 Blöcke“ mit automatischer Prüfung (pruefung.lua)
--   * Ergebnis per HTTP-POST an eine konfigurierbare Adresse (später der MINTforge-Dienst)
--
-- Es werden keine Personendaten verarbeitet, nur Pseudonyme. Texte für Schüler:innen auf Deutsch.

local modname = core.get_current_modname()
local modpath = core.get_modpath(modname)

-- Muss im Hauptteil der Mod stehen und darf nicht an andere Mods weitergegeben werden (lua_api.md).
local http = core.request_http_api and core.request_http_api()

local token = dofile(modpath .. "/token.lua")
local pruefung = dofile(modpath .. "/pruefung.lua")

local function einstellung(name, standard)
	local wert = core.settings:get("mintforge." .. name)
	if wert == nil or wert == "" then
		return standard
	end
	return wert
end

local einstellungen = {
	ergebnis_url = einstellung("ergebnis_url", ""),
	welt_id = einstellung("welt_id", "prototyp"),
	token_fenster = tonumber(einstellung("token_fenster", "86400")),
	quest_flaeche = tonumber(einstellung("quest_flaeche", "24")),
	lehrkraefte = {},
}
for name in einstellung("lehrkraefte", ""):gmatch("[^,%s]+") do
	einstellungen.lehrkraefte[name] = true
end

local speicher = core.get_mod_storage()

-- Geheimnisse kommen aus der Umgebung des Servers, nie aus dem Repo.
local schluessel = os.getenv("MINTFORGE_TOKEN_SCHLUESSEL") or ""
local ergebnis_token = os.getenv("MINTFORGE_ERGEBNIS_TOKEN") or ""

if #schluessel >= 32 then
	loadfile(modpath .. "/anmeldung.lua")(token)(einstellungen, speicher, schluessel)
	core.log("action", "[mintforge] Anmeldung mit Token aktiv")
else
	core.log("warning", "[mintforge] MINTFORGE_TOKEN_SCHLUESSEL fehlt oder ist kürzer als 32 Zeichen: "
		.. "Anmeldung mit Token ist AUS, Luanti nutzt seine normale Anmeldung")
end

core.register_privilege("mintforge_lehrkraft", {
	description = "Darf Quests für alle starten und zurücksetzen",
	give_to_singleplayer = true,
	give_to_admin = true,
})

-- ---------------------------------------------------------------------------------------------------------
-- Blöcke: eigene, damit die Mod ohne Minetest Game auskommt. Farben als Platzhalter, später aus den
-- Design-Tokens der Marke.
-- ---------------------------------------------------------------------------------------------------------

core.register_node(modname .. ":boden", {
	description = "Laborboden",
	tiles = {"[fill:16x16:#8A96A3^[fill:15x15:0,0:#9AA6B2"},
	groups = {mintforge_fest = 1},
	diggable = false,
	is_ground_content = true,
})

core.register_node(modname .. ":zaun", {
	description = "Zaun",
	drawtype = "fencelike",
	tiles = {"[fill:16x16:#C98A4B"},
	inventory_image = "[fill:16x16:#00000000^[fill:4x16:2,0:#C98A4B^[fill:4x16:10,0:#C98A4B"
		.. "^[fill:16x2:0,4:#C98A4B^[fill:16x2:0,10:#C98A4B",
	paramtype = "light",
	sunlight_propagates = true,
	selection_box = {type = "fixed", fixed = {-1/8, -1/2, -1/8, 1/8, 1/2, 1/8}},
	groups = {dig_immediate = 3, mintforge_zaun = 1},
})

core.register_alias("mapgen_stone", modname .. ":boden")
core.register_alias("mapgen_water_source", "air")
core.register_alias("mapgen_river_water_source", "air")

-- ---------------------------------------------------------------------------------------------------------
-- Quest
-- ---------------------------------------------------------------------------------------------------------

local QUEST_ID = "gehege-24"
local quest_text = string.format(
	"Quest: Baue mit dem Zaun ein rechteckiges Gehege, das innen genau %d Blöcke Fläche hat. "
	.. "Probiere verschiedene Formen aus – wie lang muss der Zaun jeweils sein? "
	.. "Sobald dein Gehege geschlossen ist, prüfe ich es automatisch.", einstellungen.quest_flaeche)

local function sende_ergebnis(name, ergebnis, geschafft)
	if einstellungen.ergebnis_url == "" then
		return
	end
	if not http then
		core.log("warning", "[mintforge] Keine HTTP-Rechte: secure.http_mods muss " .. modname .. " enthalten")
		return
	end
	local daten = {
		quest = QUEST_ID,
		welt = einstellungen.welt_id,
		pseudonym = name,
		geschafft = geschafft,
		flaeche = ergebnis.flaeche,
		zaunlaenge = ergebnis.zaunlaenge,
		innen = {ergebnis.innen_breite, ergebnis.innen_tiefe},
		zeit = os.time(),
	}
	local kopf = {"Content-Type: application/json"}
	if ergebnis_token ~= "" then
		kopf[#kopf + 1] = "Authorization: Bearer " .. ergebnis_token
	end
	http.fetch({
		url = einstellungen.ergebnis_url,
		method = "POST",
		data = core.write_json(daten),
		extra_headers = kopf,
		timeout = 10,
	}, function(antwort)
		if not antwort.succeeded or antwort.code < 200 or antwort.code >= 300 then
			core.log("warning", string.format("[mintforge] Ergebnis für %s nicht angekommen (Code %s)",
				name, tostring(antwort.code)))
		else
			core.log("action", "[mintforge] Ergebnis für " .. name .. " gemeldet")
		end
	end)
end

local function ist_zaun(pos)
	return core.get_node(pos).name == modname .. ":zaun"
end

-- Letzte gemeldete Form je Spieler:in, damit dieselbe Form nicht bei jedem Block erneut gemeldet wird.
local zuletzt = {}

local function pruefe_um(pos, spieler)
	if not spieler or not spieler:is_player() then
		return
	end
	local name = spieler:get_player_name()
	local bloecke, zu_viele = pruefung.sammle(pos, ist_zaun)
	if zu_viele then
		return
	end
	local ergebnis = pruefung.rechteck(bloecke)
	if not ergebnis then
		return
	end
	local kennung = string.format("%d,%d,%d:%dx%d", ergebnis.ecke.x, ergebnis.ecke.y, ergebnis.ecke.z,
		ergebnis.innen_breite, ergebnis.innen_tiefe)
	if zuletzt[name] == kennung then
		return
	end
	zuletzt[name] = kennung
	local text, geschafft = pruefung.rueckmeldung(ergebnis, einstellungen.quest_flaeche)
	core.chat_send_player(name, text)
	sende_ergebnis(name, ergebnis, geschafft)
end

core.register_on_placenode(function(pos, neu, spieler)
	if neu.name == modname .. ":zaun" then
		pruefe_um(pos, spieler)
	end
end)

local function quest_starten(spieler)
	local inv = spieler:get_inventory()
	inv:set_size("main", 8)
	inv:set_list("main", {})
	inv:add_item("main", ItemStack(modname .. ":zaun 99"))
	inv:add_item("main", ItemStack(modname .. ":zaun 99"))
	spieler:hud_set_hotbar_itemcount(8)
	core.chat_send_player(spieler:get_player_name(), quest_text)
end

core.register_on_joinplayer(function(spieler)
	quest_starten(spieler)
end)

core.register_on_leaveplayer(function(spieler)
	zuletzt[spieler:get_player_name()] = nil
end)

core.register_chatcommand("quest", {
	description = "Zeigt die Quest und füllt deinen Zaunvorrat auf",
	func = function(name)
		local spieler = core.get_player_by_name(name)
		if spieler then
			quest_starten(spieler)
		end
		return true
	end,
})

core.register_chatcommand("quest_alle", {
	description = "Startet die Quest für alle in der Welt neu (Lehrkraft)",
	privs = {mintforge_lehrkraft = true},
	func = function()
		for _, spieler in ipairs(core.get_connected_players()) do
			quest_starten(spieler)
		end
		return true, "Quest für alle neu gestartet."
	end,
})

-- ---------------------------------------------------------------------------------------------------------
-- Testhilfe, nur wenn der Server mit MINTFORGE_TESTMODUS=1 läuft (End-to-End-Test in CI, nie im Unterricht)
-- ---------------------------------------------------------------------------------------------------------

if os.getenv("MINTFORGE_TESTMODUS") == "1" then
	core.log("warning", "[mintforge] TESTMODUS aktiv – nur für automatische Tests")
	local geloest = {}

	-- Baut ein Gehege mit Innenmaß 4 × 6 neben der Spielfigur und prüft es wie beim Bauen von Hand.
	local function baue_testgehege(name, ausloeser)
		local spieler = core.get_player_by_name(name)
		if not spieler or geloest[name] then
			return
		end
		geloest[name] = true
		local p = vector.round(spieler:get_pos())
		local ecke = {x = p.x + 2, y = p.y, z = p.z - 3}
		local gegenueber = {x = ecke.x + 5, y = ecke.y, z = ecke.z + 7}
		core.log("action", string.format("[mintforge] TEST: baue Gehege für %s (%s) ab %s",
			name, ausloeser, core.pos_to_string(ecke)))
		core.emerge_area(ecke, gegenueber, function(_, _, offen)
			if offen > 0 then
				return
			end
			for x = ecke.x, gegenueber.x do
				for z = ecke.z, gegenueber.z do
					if x == ecke.x or x == gegenueber.x or z == ecke.z or z == gegenueber.z then
						core.set_node({x = x, y = ecke.y, z = z}, {name = modname .. ":zaun"})
					end
				end
			end
			pruefe_um(ecke, core.get_player_by_name(name))
		end)
	end

	core.register_chatcommand("test_gehege", {
		description = "Nur Testmodus: baut ein Gehege mit 24 Blöcken Fläche",
		func = function(name)
			core.log("action", "[mintforge] TEST: /test_gehege von " .. name)
			baue_testgehege(name, "Chat-Befehl")
			return true
		end,
	})

	core.register_on_joinplayer(function(spieler)
		local name = spieler:get_player_name()
		geloest[name] = nil
		core.after(2, function()
			local s = core.get_player_by_name(name)
			if s then
				core.log("action", string.format("[mintforge] TEST: %s ist in der Welt bei %s",
					name, core.pos_to_string(vector.round(s:get_pos()))))
			end
		end)
		-- Rückfall, falls die Tastatur im Browser nicht ankommt: nach 60 Sekunden selbst bauen.
		core.after(60, baue_testgehege, name, "automatisch")
	end)
end

-- Für den Rauchtest in CI: zeigt, dass die Mod vollständig geladen wurde.
core.log("action", "[mintforge] mintforge_quest geladen, Quest " .. QUEST_ID)
