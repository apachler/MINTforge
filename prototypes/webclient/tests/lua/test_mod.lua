-- Tests für die reine Logik der Mod (ohne Luanti), mit LuaJIT:
--   luajit tests/lua/test_mod.lua           (im Ordner prototypes/webclient)
-- Die Erwartungswerte für das Token stammen aus werkzeuge/token.py, damit beide Seiten gleich rechnen.

local basis = arg[0]:match("^(.*)/tests/lua/") or "."
package.path = basis .. "/tests/lua/?.lua;" .. package.path
_G.bit = require("bit")

local sha256 = require("sha256")
local token = dofile(basis .. "/mods/mintforge_quest/token.lua")
local pruefung = dofile(basis .. "/mods/mintforge_quest/pruefung.lua")

local fehler = 0
local anzahl = 0

local function test(name, fn)
	anzahl = anzahl + 1
	local ok, err = pcall(fn)
	if ok then
		print("ok   " .. name)
	else
		fehler = fehler + 1
		print("FAIL " .. name .. "\n     " .. tostring(err))
	end
end

local function gleich(ist, soll, was)
	if ist ~= soll then
		error(string.format("%s: erwartet %s, bekommen %s", was or "Wert", tostring(soll), tostring(ist)), 2)
	end
end

local function hex(s)
	return (s:gsub(".", function(c) return string.format("%02x", c:byte()) end))
end

-- SHA-256 -----------------------------------------------------------------------------------------------

test("SHA-256 Testvektoren", function()
	gleich(hex(sha256("")), "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855", "leer")
	gleich(hex(sha256("abc")), "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad", "abc")
	gleich(hex(sha256(string.rep("a", 1000))),
		"41edece42d63e8d9bf515a9ba6932e1c20cbc9f5a5d134645adb5db1b9737ea3", "1000×a")
end)

-- Token -------------------------------------------------------------------------------------------------

local SCHLUESSEL = "geheimer-testschluessel-nur-fuer-tests-0123456789"

test("HMAC-SHA256 nach RFC 4231, Fall 2", function()
	gleich(token.hmac_sha256(sha256, "Jefe", "what do ya want for nothing?"),
		"5bdcc146bf60754e6a042426089575c75a003f089d2739839dec58b964ec3843")
end)

test("Token passt zu werkzeuge/token.py", function()
	-- python3 werkzeuge/token.py Fuchs_07 --zeit 1793500000 --nur-token (Fenster 86400)
	local fenster = token.zeitfenster(1793500000, 86400)
	gleich(fenster, 20758, "Zeitfenster")
	gleich(token.passwort(sha256, SCHLUESSEL, "Fuchs_07", fenster), "mf1-24e0b156d5b2420bdea73b78")
end)

test("Token hängt an Name und Zeitfenster", function()
	local a = token.passwort(sha256, SCHLUESSEL, "Fuchs_07", 20758)
	if a == token.passwort(sha256, SCHLUESSEL, "Fuchs_08", 20758) then error("gleich trotz anderem Namen") end
	if a == token.passwort(sha256, SCHLUESSEL, "Fuchs_07", 20759) then error("gleich trotz anderem Tag") end
end)

test("Namen werden geprüft", function()
	gleich(token.name_gueltig("Fuchs_07"), true)
	gleich(token.name_gueltig("a-b"), true)
	gleich(token.name_gueltig(""), false)
	gleich(token.name_gueltig("Leerzeichen drin"), false)
	gleich(token.name_gueltig("Umlaut_ä"), false)
	gleich(token.name_gueltig(string.rep("x", 21)), false)
end)

-- Prüfung -----------------------------------------------------------------------------------------------

-- Baut den Rand eines Rechtecks mit Innenmaß b × t; Ecke bei (x0, z0).
local function rand(b, t, x0, z0)
	local liste = {}
	for x = 0, b + 1 do
		for z = 0, t + 1 do
			if x == 0 or z == 0 or x == b + 1 or z == t + 1 then
				liste[#liste + 1] = {x = (x0 or 0) + x, y = 5, z = (z0 or 0) + z}
			end
		end
	end
	return liste
end

local function als_welt(liste)
	local belegt = {}
	for _, p in ipairs(liste) do
		belegt[p.x .. "," .. p.y .. "," .. p.z] = true
	end
	return function(p) return belegt[p.x .. "," .. p.y .. "," .. p.z] == true end
end

test("4 × 6 ist ein Rechteck mit Fläche 24 und Zaunlänge 24", function()
	local e = pruefung.rechteck(rand(4, 6))
	gleich(e.flaeche, 24, "Fläche")
	gleich(e.zaunlaenge, 24, "Zaunlänge")
	gleich(e.innen_breite, 4)
	gleich(e.innen_tiefe, 6)
end)

test("Alle Formen mit Fläche 24 werden erkannt", function()
	for _, m in ipairs({{1, 24}, {2, 12}, {3, 8}, {4, 6}, {6, 4}, {24, 1}}) do
		local e = pruefung.rechteck(rand(m[1], m[2], 100, -7))
		gleich(e and e.flaeche, 24, m[1] .. "×" .. m[2])
		gleich(e.zaunlaenge, 2 * (m[1] + m[2]) + 4, "Zaunlänge " .. m[1] .. "×" .. m[2])
	end
end)

test("Lücke im Zaun ist kein Rechteck", function()
	local liste = rand(4, 6)
	table.remove(liste, 3)
	gleich(pruefung.rechteck(liste), nil)
end)

test("Zaun im Inneren ist kein Rechteck", function()
	local liste = rand(4, 6)
	liste[#liste + 1] = {x = 2, y = 5, z = 2}
	gleich(pruefung.rechteck(liste), nil)
end)

test("Ausreißer neben dem Rechteck zählt nicht als Rechteck", function()
	local liste = rand(3, 3)
	liste[#liste + 1] = {x = -1, y = 5, z = 0}
	gleich(pruefung.rechteck(liste), nil)
end)

test("L-Form ist kein Rechteck", function()
	local liste = {}
	for _, p in ipairs({{0, 0}, {1, 0}, {2, 0}, {0, 1}, {2, 1}, {0, 2}, {2, 2}, {3, 2}, {4, 2},
		{0, 3}, {4, 3}, {0, 4}, {1, 4}, {2, 4}, {3, 4}, {4, 4}}) do
		liste[#liste + 1] = {x = p[1], y = 0, z = p[2]}
	end
	gleich(pruefung.rechteck(liste), nil)
end)

test("Sammeln folgt nur Kanten, nicht Ecken", function()
	local liste = rand(2, 2)
	liste[#liste + 1] = {x = 4, y = 5, z = 4} -- berührt das Rechteck nur über die Ecke
	local gefunden = pruefung.sammle({x = 0, y = 5, z = 0}, als_welt(liste))
	gleich(#gefunden, 12, "gesammelt")
	gleich(pruefung.rechteck(gefunden).flaeche, 4)
end)

test("Sammeln stoppt bei der Obergrenze", function()
	local _, zu_viele = pruefung.sammle({x = 0, y = 0, z = 0}, function() return true end)
	gleich(zu_viele, true)
end)

test("Rückmeldung nennt Fläche und Abstand zum Ziel", function()
	local text, geschafft = pruefung.rueckmeldung(pruefung.rechteck(rand(4, 6)), 24)
	gleich(geschafft, true)
	assert(text:find("4 × 6 = 24", 1, true), text)
	text, geschafft = pruefung.rueckmeldung(pruefung.rechteck(rand(3, 3)), 24)
	gleich(geschafft, false)
	assert(text:find("fehlen noch 15", 1, true), text)
	text = pruefung.rueckmeldung(pruefung.rechteck(rand(5, 5)), 24)
	assert(text:find("1 Blöcke zu viel", 1, true), text)
end)

print(string.format("\n%d Tests, %d fehlgeschlagen", anzahl, fehler))
os.exit(fehler == 0 and 0 or 1)
