import conn from "./conn.js";
import nullOrUndefined from "./nullOrUndefined.js";
import passHash from "./passHash.js";

class UserHandler {
    checkData(user) {
        const errors = [];
        const emailRegex = /^[\w\_\-\.]{1,255}\@[\w\_\-\.]{1,255}\.[\w]{2,8}$/;

        if(nullOrUndefined(user.email) || !emailRegex.test(user.email)) {
            errors.push("A megadott email cím nem megefelelő!");
        }

        if(nullOrUndefined(user.pass) || user.pass.length < 8) {
            errors.push("A jelszónak legalább 8 karakteresnek kell lennie!");
        }
        /*
            user.pass.length > 8 érdemes olyan jelszót megkövetelni a felhasználótól, ami egy minimálisan is biztonságos -> user.pass.length > 8
        */

        if(nullOrUndefined(user.userName) || user.userName < 5) { //legyen legalább 5 karakteres a userName 
            errors.push("A felhasználónévnek legalább 5 karakteresnek kell lennie!");
        } 

        if(user.pass !== user.passAgain) {
            errors.push("A jelszó nem egyezik!")
        }
            
        return errors;
    }

    async register(user) {
        const errors = this.checkData(user);
        if(errors.length > 0) {
            throw {
                status: 400,
                message: errors
            }
        }

        try {
            const response = await conn.promise().query(
                `INSERT INTO users (userName, email, pass)
                VALUES(?,?,?)`
                [user.userName, user.email, passHash(user.pass)]
            );

            if(response[0].affectedRows === 1) {
                return {
                    status: 201,
                    message: ["A regisztráció sikeres volt!"]
                }
            } else {
                throw {
                    status: 503, 
                    message: ["A regisztrációs szolgáltatás jelenleg nem érhető el!"]
                }
            }
        } catch(err) {
            console.log("UserHandler.register: ", err);

            if(err.status) {
                throw err;
            }
            
            throw {
                status: 503,
                message: ["A regisztrációs szolgáltatás jelenleg nem elérhető!"]
            }
        }
    }

    async login(user) {
        try {
            const response = await conn.promise().query(
                `SELECT userID, userName FROM users WHERE email = ? AND pass = ?`,
                [user.email, passHash(user.pass)]
            )

            if(response[0] === 1) {
                return {
                    status: 200,
                    message: response[0][0]
                }
            } else {
                throw {
                    status: 401, 
                    message: ["Nem megfelelő felhasználónév/jelszó páros!"]
                }
            }
        } catch (err) {
            console.log("UserHandler.login: ", err);

            if(err.status) {
                throw err;
            }

            throw {
                status: 503,
                message: ["A bejelentkezési szolgáltatás jelenleg nem elérhető!"]
            }
        }
    }

    async search() {

    }

}

export default UserHandler;

/*
    app.post("/login", async (req, res)=> {
    let response;

    try{
        response = uh.login(req.body);
    } catch(err) {
        response = err;
    }

    response.success = response.status.toString()[0] === "2";


    res.status(response.status).redirect(
        response.success ? "/profile" : `/bejelentkezes?message=${response.message[0]}`
    )

})

Mit csinál itt a login függvény meg az amit az index.js-nek csináltunk hozzá egy POST kérés-vel 

1. Login függvény 
    - A függvény vár egy user objektumot bemenetként -> req.body lesz majd, adatok amiket beír a felhasználó 
    - Megprobálja lekérni az adatbázisból a felhasználó email címét és hash-elt jelszavát 
            const response = await conn.promise().query(
                `SELECT * FROM users WHERE email = ? AND pass = ?`,
                [user.email, passHash(user.pass)]
            )
    - Ha talál egyezést (vagyis a response[0] === 1), akkor egy sikeres választ ad vissza 200-as státusszal 
    + Ha nincs egyezés, akkor egy hibát dob 401-es státusszal és egy üzenettel, ami jelzi, hogy a felhasználó/jelszó páros hibás 
            if(response[0] === 1) {
                return {
                    status: 200,
                    message: response[0]
                }
            } else {
                throw {
                    status: 401, 
                    message: ["Nem megfelelő felhasználónév/jelszó páros!"]
                }

2. Hibakezelés 
    - Ha bármilyen hiba történik a lekédezés során (pl. adatbázis hiba vagy lekérdezési probléma) a catch blokk azt kezeli 
    - Ha a hiba objektumnak vean status tulajdonsága, újra dobja (pl. a fenti 401-es hiba)
        } catch (err) {
            console.log("UserHandler.login: ", err);

            if(err.status) {
                throw err;
            }

            throw {
                status: 503,
                message: ["A bejelentkezési szolgáltatás jelenleg nem elérhető!"]
            }
    - Ellenkező esetben egy 503-as hibát dob, ami azt jelzi, hogy a bejelentkezési szolgáltatás jelenleg nem elérhető 

Tehát az fontos, hogy itt valami hiba van és ha van status-a, akkor azt biztos, hogy mi dobtuk és ezt továbbdobjuk ha meg hiba van, de nincsen 
statuszkódja, akkor dobunk egy bejelentkezési szolgáltatás hibát 

3. POST kérés kezelő 
    - Amikor egy POST kérés érkezik a /login útvonalra, a szerver meghívja a uh.login(req.body) függvényt a felhasználó hitelesítésére 
    - Ha hiba történik a bejelentkezés során, azt a catch blokk elkapja 
        és a RESPONSE az ERR objektum lesz (ez nagyon fontos)!!!! 
        vagy ha nincsen hiba, akkor meg status 200 és a message-ben az adatok, amiket felvitt a felhasználó             
                return {
                    status: 200,
                    message: response[0]
                }
    - response.success az meg egy boolean lesz, amit status (státuszkód) alapján határozunk meg. 
        Ha a status 2-vel kezdődik, akkor sikeresnek tekintjük és true lesz majd az értéke!!!! 
    A bejelentkezés sikereségétől föggően a felhasználót vagy a profil oldalra írányítja (siker esetén) vagy vissza a bejelentkezes-re 
    egy hibaüzenettel 
    -> 
        res.status(response.status).redirect(
        response.success ? "/profile" : `/bejelentkezes?message=${response.message[0]}`
    )

    Összefoglalás 
    - A felhasználói adatokat elküldjük a userHandler.login()-nek 
    - Ha sikeres a bejelentkezés, egy sikeres választ kapunk vissza 
    - Ha hibás a bejelentkezés (helytelen adatok vagy szerverhiba), azt a rendszer kezeli és megfelelő választ küld a kliensnek 
*/