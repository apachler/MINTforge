-- Automatische Prüfung der Beispiel-Quest „Zaun um 24 Blöcke“
--
-- Reine Logik ohne Luanti-Aufrufe, damit sie in CI mit LuaJIT getestet werden kann.
-- Ein Zaun zählt als Rechteck, wenn die zusammenhängenden Zaunblöcke auf einer Höhe genau den Rand eines
-- Rechtecks bilden: keine Lücke, kein Zaun im Inneren, keine Ausreißer. Die eingezäunte Fläche ist das Innere.

local M = {}

-- Höchstzahl an Zaunblöcken, die eine Prüfung ansieht; schützt den Server vor riesigen Zaunnetzen.
M.MAX_BLOECKE = 400

local function schluessel(x, z)
	return x .. "," .. z
end

-- Sammelt ab `start` alle Zaunblöcke auf derselben Höhe, die über Kanten (nicht über Ecken) verbunden sind.
-- `ist_zaun(pos)` liefert true, wenn an `pos` ein Zaun steht.
-- Rückgabe: Liste von Positionen, und true, wenn die Grenze M.MAX_BLOECKE erreicht wurde.
function M.sammle(start, ist_zaun)
	local gesehen = {[schluessel(start.x, start.z)] = true}
	local offen = {start}
	local gefunden = {}
	local nachbarn = {{1, 0}, {-1, 0}, {0, 1}, {0, -1}}
	while #offen > 0 do
		local pos = table.remove(offen)
		gefunden[#gefunden + 1] = pos
		if #gefunden >= M.MAX_BLOECKE then
			return gefunden, true
		end
		for _, n in ipairs(nachbarn) do
			local p = {x = pos.x + n[1], y = start.y, z = pos.z + n[2]}
			local k = schluessel(p.x, p.z)
			if not gesehen[k] and ist_zaun(p) then
				gesehen[k] = true
				offen[#offen + 1] = p
			end
		end
	end
	return gefunden, false
end

-- Prüft, ob die Positionen genau den Rand eines Rechtecks bilden.
-- Rückgabe: nil, wenn nicht; sonst eine Tabelle mit Innenmaßen, Fläche und Zaunlänge.
function M.rechteck(positionen)
	local n = #positionen
	if n < 8 then
		return nil
	end
	local min_x, max_x = math.huge, -math.huge
	local min_z, max_z = math.huge, -math.huge
	local y = positionen[1].y
	for _, p in ipairs(positionen) do
		if p.y ~= y then
			return nil
		end
		min_x, max_x = math.min(min_x, p.x), math.max(max_x, p.x)
		min_z, max_z = math.min(min_z, p.z), math.max(max_z, p.z)
	end
	local breite = max_x - min_x + 1
	local tiefe = max_z - min_z + 1
	if breite < 3 or tiefe < 3 or n ~= 2 * (breite + tiefe) - 4 then
		return nil
	end
	local doppelt = {}
	for _, p in ipairs(positionen) do
		local k = schluessel(p.x, p.z)
		local am_rand = p.x == min_x or p.x == max_x or p.z == min_z or p.z == max_z
		if doppelt[k] or not am_rand then
			return nil
		end
		doppelt[k] = true
	end
	-- n Randfelder, alle verschieden und alle am Rand, und der Rand hat genau n Felder: also lückenlos.
	local innen_breite = breite - 2
	local innen_tiefe = tiefe - 2
	return {
		innen_breite = math.min(innen_breite, innen_tiefe),
		innen_tiefe = math.max(innen_breite, innen_tiefe),
		flaeche = innen_breite * innen_tiefe,
		zaunlaenge = n,
		ecke = {x = min_x, y = y, z = min_z},
	}
end

-- Rückmeldung an die Spieler:in. Absichtlich ohne Lösung, nur mit dem, was sie gebaut hat.
function M.rueckmeldung(ergebnis, ziel)
	if not ergebnis then
		return nil
	end
	local text = string.format("Dein Zaun ist ein Rechteck: innen %d × %d = %d Blöcke, Zaunlänge %d.",
		ergebnis.innen_breite, ergebnis.innen_tiefe, ergebnis.flaeche, ergebnis.zaunlaenge)
	if ergebnis.flaeche == ziel then
		return text .. " Geschafft!", true
	elseif ergebnis.flaeche < ziel then
		return text .. string.format(" Es fehlen noch %d Blöcke bis %d.", ziel - ergebnis.flaeche, ziel), false
	end
	return text .. string.format(" Das sind %d Blöcke zu viel.", ergebnis.flaeche - ziel), false
end

return M
