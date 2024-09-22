/*

1. SQL Injection veszélye:

Bár használsz lekérdezési paramétereket (prepared statements), érdemes ellenőrizni, hogy minden adatbázis interakció során használod-e őket. 
A jelenlegi megoldás valószínűleg már védi az SQL injection-től, de figyelni kell arra, 
hogy mindenhol konzisztensek legyenek ezek a biztonsági intézkedések.

2. Erősebb jelszó hashelés:

Ha még nem tetted meg, használj egy modern hashelési algoritmust, mint például bcrypt, argon2 vagy scrypt, 
amelyek lassabbak és biztonságosabbak a brute-force támadásokkal szemben.

3. Hibaüzenetek kezelése:

A rendszer 401-es hibát dob, ha a felhasználónév/jelszó páros nem megfelelő. Fontos, hogy ne legyen külön hibaüzenet, 
ha a felhasználó létezik, de a jelszó hibás. 
Ez megakadályozza, hogy egy támadó felismerje, hogy egy adott email cím regisztrált-e a rendszerben (brute-force elleni védelem).

4. Rate limiting:

Használj rate limitinget vagy captcha-t a brute-force támadások megelőzése érdekében. 
Enélkül egy támadó folyamatosan próbálkozhat felhasználói nevek és jelszavak kitalálásával.

5. Token alapú hitelesítés (pl. JWT):

A jelenlegi rendszerben nem látszik session kezelés vagy token alapú hitelesítés. 
JWT (JSON Web Token) vagy session alapú hitelesítés használata elengedhetetlen a biztonságos bejelentkezési rendszerekben. 
Ez lehetővé teszi, hogy a felhasználók egyszer bejelentkezzenek, majd a további kéréseknél azonosítva legyenek anélkül, 
hogy újra meg kellene adniuk a jelszót.

6. SSL/TLS használata:

Győződj meg arról, hogy a bejelentkezési oldalt SSL (https) alatt használják, 
hogy a jelszavak titkosítva kerüljenek továbbításra az interneten.

7. Auditálás és naplózás:

Hozz létre naplókat a bejelentkezési kísérletekről, sikeres és sikertelen bejelentkezésekről. 
Ez segíthet észlelni gyanús tevékenységeket, és lehetőséget biztosít az adminisztrátoroknak a biztonság fenntartására.

8. Csatlakozási hibák kezelése:

A catch blokk jelenleg csak egy általános üzenetet dob, ha az adatbázis elérhetetlen. 
Fontos részletesebben kezelni az ilyen hibákat, például különbséget tenni a hálózati hiba, adatbázis hiba vagy időkorlát között. 
Így jobban diagnosztizálhatók lesznek a problémák.
*/