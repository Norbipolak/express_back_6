import conn from "./conn.js";
import nullOrUndefined from "./nullOrUndefined.js";


class Profile {
    checkData(profile) {
        const errors = [];
        const emailRegex = /^[\w\_\-\.]{1,255}\@[\w\_\-\.]{1,255}\.[\w]{2,8}$/;

        if(nullOrUndefined(profile.email) || !emailRegex.test(profile.email)) {
            errors.push("A megadott email cím nem megefelelő!");
        }

        if(nullOrUndefined(profile.userName) || profile.userName < 5) { 
            errors.push("A felhasználónévnek legalább 5 karakteresnek kell lennie!");
        } 

        if(nullOrUndefined(profile.firstName) || profile.firstName < 4) { 
            errors.push("A keresztnévnek legalább 4 karakteresnek kell lennie!");
        } 

        
        if(nullOrUndefined(profile.lastName) || profile.lastName < 4) { 
            errors.push("A vezetéknévnek legalább 4 karakteresnek kell lennie!");
        } 

        return errors;
    }

    async updateProfile(profile) {
        const errors = checkData(profile);

        if(errors.length > 0) {
            throw {
                status: 400,
                message: errors
            }
        }

        try {
            const response = await conn.promise().query(`
                UPDATE users SET userName = ?, email = ?, firstName = ?, lastName = ?
                WHERE userID = ?`,
                [profile.userName.trim(), profile.email.trim(), 
                profile.firstName.trim(), profile.lastName.trim(),
                profile.userID]
            )

            if(response[0].affectedRows === 1) { //hány rekordra van hatással ez a bizpnyos update
                return {
                    status: 200,
                    message: ["Sikeres mentés!"]
                }
            } else {
                throw {
                    status: 404,
                    /*
                        Mert hogyha nem okozott semmilyen módosítást az adatbázisban, akkor nincs is ilyen rekord!! 
                    */
                   message: ["A felhasználói profil nem található!"]
                }
            }

        } catch(err) {
            console.log("Profile.updateProfile: ", err);

            if(err.status) {
                throw err;
            }
            throw {
                status: 503,
                message: ["A profil mentése szolgáltatás jelenleg nem elérhető!"]
            }
        }
    }

    async getProfile() {
        try {
            const response = await conn.promise().query(`
                SELECT * FROM users WHERE userID = ?`,
                [userID]
            )

            if(response[0].length > 0) {
                return {
                    status: 200,
                    message: response[0][0] //mert itt az első rekord 
                }
            } else {
                throw {
                    status: 404, 
                    message: ["A felhasználói profil nem található!"]
                }
            }

        } catch(err) {
            console.log("Profile.getProfile: ", err);

            if(err.status) {
                throw err;
            }
            throw {
                status: 503,
                message: ["A szolgáltatás jelenleg nem elérhető!"]
            }
        }
    }


}  

export default Profile;

/*
    Be kell hívni a conn-t, meg amit majd be tudunk hívni meg a nullOrUndefined
    amit a userHandler-ben is be kellett hívni, mert kell egy createConnection az sql-hez illetve a nullOrDefined az csak egy segédfüggvény 
    fontos, hogy .js-es végződés az ott legyen 

    Kezdhetünk ott, hogy ellenőrizzük a profil adatokat, ez lesz a checkData(profile), hogy bejön majd egy profile objektum 
    Most van egy userName, firstName, email stb a jelszómódosítás meg külön lesz!!! 
    Ez a függvény is nagyon hasonló lesz, mint a userHandler-ben a checkData!! Az lenne a legszebb, hogy mindkettőnél ugyanazt használnánk
    csak ott nincsen firstName meg lastName, ami itt van! 
    ->
        checkData(profile) {
        const errors = [];
        const emailRegex = /^[\w\_\-\.]{1,255}\@[\w\_\-\.]{1,255}\.[\w]{2,8}$/;

        if(nullOrUndefined(profile.email) || !emailRegex.test(profile.email)) {
            errors.push("A megadott email cím nem megefelelő!");
        }

        if(nullOrUndefined(profile.userName) || profile.userName < 5) { 
            errors.push("A felhasználónévnek legalább 5 karakteresnek kell lennie!");
        } 

        if(nullOrUndefined(profile.firstName) || profile.firstName < 4) { 
            errors.push("A keresztnévnek legalább 4 karakteresnek kell lennie!");
        } 

        
        if(nullOrUndefined(profile.lastName) || profile.lastName < 4) { 
            errors.push("A vezetéknévnek legalább 4 karakteresnek kell lennie!");
        } 

        return errors;

    És most jön az updateProfile, ahol szintén bekérünk egy profile-t 

    updateProfile(profile) {
        const errors = checkData(profile);
    }

    Itt is az első dolog, hogy megszerezzük az errorokat, amiket az elöző függvényben dobtunk (mert ugye ott az van return-ölve)
    És ezeket elmentsük egy változóba -> const errors = checkData(profile);

    Második lépés, hogyha ez az errors nem üres, tehát a length-je nagyobb, mint null 
    akkor dobunk (throw) egy objektumot, amiben lesz egy status, ami 400 és a message-ben pedig az errors tömb -> message: errors

            if(errors.length > 0) {
            throw {
                status: 400,
                message: errors
            }
        }


    Egyébként try-catch blokk, ahol az err naggyából ugyanaz, mint a userHandler-ben, annyi a különbség, hogy hol dobtuk, tehát 
    majd azt kell console.log-olni -> console.log("Profile.updateprofile: ", err);

            } catch(err) {
            console.log("Profile.updateProfile: ", err);
            throw {

            if(err.status) {
                throw err;
            }
                status: 503,
                message: ["A profil mentése szolgáltatás jelenleg nem elérhető!"]
            }
        }
    Fontos, hogy az updateProfile az async legyen, mert itt majd fogunk await-elni!!! 
    async updateProfile(profile)
    ...
    const response = await conn.promise().query(...)
    Így lehet majd update-elni, UPDATE tablename SET és megadjuk, hogy melyik mezőket akarjuk majd update-elni 
    Meg ami fontos, hogy nem az összeset, csak azokat, ahol a userID egy bizonyos ID!!! 
    -> 
            const response = await conn.promise().query(`
                UPDATE users SET userName = ?, email = ?, firstName = ?, lastName = ?
                WHERE userID = ?
            `)

    Itt pedig megadjuk neki ugyanolyan sorrendben, hogy a query-ben csináltuk 
                .. UPDATE users SET userName = ?, email = ?, firstName = ?, lastName = ?
                WHERE userID = ?`,
                [profile.userName.trim(), profile.email.trim(), 
                profile.firstName.trim(), profile.lastName.trim(),
                profile.userID]


        try {
            const response = await conn.promise().query(`
                UPDATE users SET userName = ?, email = ?, firstName = ?, lastName = ?
                WHERE userID = ?`,
                [profile.userName.trim(), profile.email.trim(), 
                profile.firstName.trim(), profile.lastName.trim(),
                profile.userID]
            )

            if(response[0].affectedRows === 1) { //hány rekordra van hatással ez a bizpnyos update
                return {
                    status: 200,
                    message: ["Sikeres mentés!"]
                }
            } else {
                throw {
                    status: 404, //Mert hogyha nem okozott semmilyen módosítást az adatbázisban, akkor nincs is ilyen rekord!! 
                    message: ["A felhasználói profil nem található!"]
                    }
                }

    Átmegyünk a private_layout és ott csinálunk egy újabb menüszerkezetet!! 
    Mert itt másféle menüpontok lesznek!! 
    <nav>
        <ul>
            <li>
                <a href="/">Home</a>  ->  ami visszavezet a home-ra
            </li>
            <li>
                <a href="/profil">Profil</a>
            </li>
            <li>
                <a href="/címek">Címek</a>  ->  /címek, hogy számlázási cím vagy szállítási és ezeket beállítani!!!
            </li>
            <li>
                <a href="vasarlasaim">Vásárlásaim</a>
            </li>
            <li>
                <a href="/logout">Kijelentkezés</a>
            </li>
        </ul>
    </nav>

    És ilyenkor ha bent vagyunk a /profil-ban, akkor meg is találhatók ezek a menüpontok
    és még a public_layout-ról le kell másolni a class-okat, hogy azt jelölje ki, ahol éppen vagyunk!!! 

    <li class="<%=page === 'profil' ? 'selected-menu' : '' %>">
        <a href="/profil">Profil</a>
    </li>
    <li class="<%=page === 'címek' ? 'selected-menu' : '' %>">
        <a href="/címek">Címek</a> ... 

    És ilyenkor kell majd megadni egy page-t is ahol renderelünk, tehát a profil-nak a get-es kérésénél 
    meg ezt a page-t meg kell adni a címek meg a vasarlasaim-nak is, amikor csináljuk az oldalt get-vel!!! 
    ->
    app.get("/profil", (req, res)=> {
    res.render("profile", {
        layout: "./layouts/private_layout",
        title: "Profil Szerkesztése",
        userName: req.session.userName,
        page: "profil"                       *
    })
    ****
    profile.ejs-ben létrehozunk egy form-ot 
        <form class="box" method="POST" action="/profil">
        <h3>Felhasználónév</h3>
        <input type="text" name="userName">

        <h3>Email cím</h3>
        <input type="text" name="email">

        <h3>Vezetéknév</h3>
        <input type="text" name="lastName">

        <h3>Keresztnév</h3>
        <input type="text" name="firstName">

        <button>Mentés</button>
    </form>

    Viszont itt majd alapból meg kell jelenniük azoknak az adatoknak, amik ki vannak töltve!!  pl.email, userName
    Kell egy olyan metódus, ami majd leszedi a profil adatokat 
    ->
    itt van egy ilyen, hogy getProfile, ahol szükség van egy userID-ra 
    *****
    Ez fontos, hogy ott legyen minden catch-ben, mert ha van egy olyan, hogy status, akkor továbbdobjuk a hibát 
    ->
    if(err.status) {
        throw err;
    }
    ->
        async getProfile() {
        try {
            const response = await conn.promise().query(`
                SELECT * FROM users WHERE userID = ?`,
                [userID]
            )

            if(response[0].length > 0) {
                return {
                    status: 200,
                    message: response[0][0] //mert itt az első rekord 
                }
            } else {
                throw {
                    status: 404, 
                    message: ["A felhasználói profil nem található!"]
                }
            }

        } catch(err) {
            console.log("Profile.getProfile: ", err);

            if(err.status) {
                throw err;
            }
            throw {
                status: 503,
                message: ["A szolgáltatás jelenleg nem elérhető!"]
            }
        }

app.get("/profil", async (req, res)=> {
    try {
        const profileData = await p.getProfile(req.session.userID);
           // Mert a getProfile függvény vár egy id-t és az alapján lehozza az összes (*) adatot, ahhoz az id-ű rekordhoz 

        res.render("profile", {
            layout: "./layouts/private_layout",
            title: "Profil Szerkesztése",
            profileData: profileData.message, //itt meg megszerezzük az összes mezőt az adatbázisból 
            page: "profil"
        })
    } catch(err) {
        res.redirect("/");
    }   
});

    <form class="box" method="POST" action="/profil">
        <h3>Felhasználónév</h3>
        <input type="text" name="userName"
        value="<%=profileData.userName%>">

        <h3>Email cím</h3>
        <input type="text" name="email"
        value="<%=profileData.email%>">

        <h3>Vezetéknév</h3>
        <input type="text" name="lastName"
        value="<%=profileData.lastName != null ? profileData.lastName : ''%>">

        <h3>Keresztnév</h3>
        <input type="text" name="firstName"
        value="<%=profileData.firstName != null ? profileData.firstName : ''%>">

    Ami nagyon fontos, hogy azt akarjuk, hogy ezek az adatok majd megjelenjenek!!! 
    Ehhez kell majd, hogy a value-val, megkaptuk az összes mező értékét a profileData-ban egy bizonyos id-hez, éppen az, aki be van jelentkezve 
    és value-val ezeknek az értékeit megjelenítjük az input mezőkben

    Ami még itt fontos, hogy a firstName meg a lastName az null és csak, akkor fogjuk kiírni az értékeit, hogyha nem null 
    ->
    value="<%=profileData.firstName != null ? profileData.firstName : ''%>">

    És ha sikeresen megkaptuk az adatokat és beírtuk mondjuk a lastName-t vagy/meg a firstName-t, akkor utána megnyomjuk a gombot 
    és át kell minket, hogy vigyen egy másik oldalra 
    ->
    csinálunk ennek egy POST-os kérést, hogy megszerezzük az adatokat, amiket ide a felhasználó beírt 
    ->
    

*/