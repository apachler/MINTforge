-- Kurzlebiges Start-Token für den Web-Client (Prototyp)
--
-- Luanti meldet Spieler:innen mit SRP an: Der Server sieht das Passwort nie im Klartext, er muss es aber
-- vorher kennen. Das Token ist deshalb ein Passwort, das Server und Aussteller unabhängig voneinander aus
-- einem gemeinsamen Schlüssel ableiten:
--
--   token = "mf1-" .. erste 24 Hex-Zeichen von HMAC-SHA256(schlüssel, "mf1|<pseudonym>|<zeitfenster>")
--   zeitfenster = floor(unix_zeit / fenster_sekunden)
--
-- Das Token gilt nur im laufenden Zeitfenster (Standard: ein UTC-Tag) und nur für dieses Pseudonym.
-- Später erzeugt es der MINTforge-Dienst beim LTI-Launch, im Prototyp `werkzeuge/token.py`.
-- Es enthält keine Personendaten.
--
-- Die Datei braucht nur eine sha256-Funktion, die rohe Bytes liefert (im Spiel core.sha256(daten, true),
-- in den Tests eine reine Lua-Umsetzung) und bleibt so ohne Luanti testbar.

local M = {}

local BLOCK = 64

M.NAME_MUSTER = "^[A-Za-z0-9_%-]+$"
M.NAME_MAX = 20 -- Grenze von Luanti für Spielernamen

local function xor_bytes(s, wert)
	local out = {}
	for i = 1, #s do
		out[i] = string.char(bit.bxor(s:byte(i), wert))
	end
	return table.concat(out)
end

local function to_hex(s)
	return (s:gsub(".", function(c) return string.format("%02x", c:byte()) end))
end

-- HMAC nach RFC 2104
function M.hmac_sha256(sha256_raw, schluessel, nachricht)
	if #schluessel > BLOCK then
		schluessel = sha256_raw(schluessel)
	end
	schluessel = schluessel .. string.rep("\0", BLOCK - #schluessel)
	local innen = sha256_raw(xor_bytes(schluessel, 0x36) .. nachricht)
	return to_hex(sha256_raw(xor_bytes(schluessel, 0x5c) .. innen))
end

function M.name_gueltig(name)
	return type(name) == "string" and #name <= M.NAME_MAX and name:match(M.NAME_MUSTER) ~= nil
end

function M.zeitfenster(jetzt, fenster_sekunden)
	return math.floor(jetzt / fenster_sekunden)
end

-- Das Passwort, das der Client für dieses Pseudonym im angegebenen Zeitfenster mitschicken muss.
function M.passwort(sha256_raw, schluessel, name, fenster)
	return "mf1-" .. M.hmac_sha256(sha256_raw, schluessel, "mf1|" .. name .. "|" .. fenster):sub(1, 24)
end

return M
