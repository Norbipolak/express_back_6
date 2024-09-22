import express from "express";
import expressEjsLayouts from "express-ejs-layouts";
import UserHandler from "./app/userHandler,js"; /*fontos, hogy itt legyen a .js*/
import session from "express-session"

const app = express();

app.set("view engine", "ejs");
app.use(expressEjsLayouts);
app.use(urlencoded({extended: true}));
app.use(express.static("assets"));

app.use(session());

app.use(session({
    secret: "asdf",
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false,
        maxAge: 24*60*60*1000
    }
}));

const uh = new UserHandler();
const p = new Profile(); //fontos, hogy így be kell hívni az összes class-t amit csináltunk 

app.get("/", (req, res)=> {
    res.render("index", {layout: "layouts/public_layout", title: "Kezdőlap", page:"index"});
});

app.post("/regisztracio", async (req, res)=> {
    let response;
    try {
        response = await uh.register(req.body); 
    } catch (err) {
        response = err;
    }

    response.success = response.status.toString(0) === "2";
    res.status(response.status);

    res.render("register_post", {
        layout: "./layout/public_layout",
        message: response.message,
        title: "Regisztráció",
        page: "regisztracio", 
        success: response.success
    })
});

app.post("/login", async (req, res)=> {
    let response;

    try{
        response = uh.login(req.body);
        req.session.userName = response.userName;
        req.session.userID = response.userID;
    } catch(err) {
        response = err;
    }

    response.success = response.status.toString()[0] === "2";


    res.status(response.status).redirect(
        response.success ? "/profil" : `/bejelentkezes?message=${response.message[0]}`
    )

})

app.get("/bejelentkezes", (req, res)=> {
    res.render("login", {
        layout: "./layouts/public_layout",
        title: "Bejelentkezés",
        page: "bejelentkezes",
        message: req.query.message ? req.query.message : ""
    })
});

app.get("/profil", async (req, res)=> {
    try {
        const profileData = await p.getProfile(req.session.userID);
        /*
            Mert a getProfile függvény vár egy id-t és az alapján lehozza az összes (*) adatot, ahhoz az id-ű rekordhoz 
        */
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

app.post("/profil", async (req, res)=> {
    let response;

    try {
        response = await p.updateProfile(req.body);
        /*
            Az a kérdés, hogy hogyan küldjük vissza a message-t, url-ben vissza tudjuk küldeni 
        */

    } catch(err) {

    }
});



app.listen(3000, console.log("the app is listening on localhost:3000"));

/*
    app.post("/login", async (req, res)=> {
    res.redirect("/profile");
})

Itt tartottunk, most szükség van egy login oldalra, maga a login.ejs már meg van, csak még nem készítettük el az oldalt 
<div class="container" >
    <form class="box" method="post" action="/login">

        <h3>Email cím</h3>
        <input name="email" type="text">

        <h3>Jelszó</h3>
        <input name="pass" type="password">

        <button>Bejelentkezés</button>

    </form>
</div>

Erre kell csinálni egy get-es login-t, hogy ezeket az adatokat a felhasználó be tudja majd írni!!! 
Ennek nem is szükséges async-nek lennie! 
-> 
app.get("/bejelentkezes", (req, res)=> {
    res.render("login", {
        layout: "./layouts/public_layout",
        title: "Bejelentkezés",
        page: "bejelemtkezes"
    });
});

title-t meg a page-t mindenképp be kell írni, mert a title-t várja a head a page-t meg a layout, hogy class-ban majd az legyen a selected-menu 
ahol megegyezik ez a page, amit itt megadunk (page: "bejelemtkezes") azzal ami ott meg van adva URL-nek -> <a href="/bejelentkezes">Bejelentkezés</a>

nodemon index ezzel tudjuk elindítani a programunkat!! 

Most csinálunk egy regisztrációt, tehát kitöltjük a form-ot, ami a /regisztracio-n van és kiírja zöldel, hogy Sikeres regisztráció! 
...
Be akarunk jelentkezni 
-> 
app.post("/login", async (req, res)=> {
    res.redirect("/profile");
})
Post-os loginnál megkapjuk az adatokat 
Itt kell csinálni egy try-catch blokkot, meg nagyon hasonló lesz, mint a regisztracio-s 
De amit ott nem csináltunk, de ebben a rendszerben nincs értelme, inkább olyankor van, amikor különválik a frontend meg a backend 
res.status(response.status); 
megadjuk a res.status-nak azt a status-t amit itt mi küldtünk -> response.status!!! 
app.post("/regisztracio", async (req, res)=> {
    let response;
    try {
        response = await uh.register(req.body); 
    } catch (err) {
        response = err;
    }

    response.success = response.status.toString(0) === "2";
    res.status(response.status);            ****

Mert mi itt nem véletlenül adjuk vissza, hogy status a userHandler-ben, hogy status 400-as, 201-es stb.
pl. -> 
    return {
        status: 201,
        message: ["A regisztráció sikeres volt!"]
    }
Mert amikor különválik a szerver és a kliensoldali kód, akkor a kliens sokkal egyszerübben tudja kezelni az adott hibákat, hogyha kap egy HTTP 
válaszkódot is (status kódot)
És ha most úgy próbálunk regisztrálni, hogy nem írtunk be semmit, akkor a Network-ben meg fog jelenni nekünk egy ilyen, hogy 
General 
Request URL:    http//:localhost:3000/regisztracio 
Request Method: POST 
Status Code:    400 Bad Request 
...
De ennek itt nincsen értélme, mert ugyanúgy megkapjuk a hibaüzeneteket, csak küldtünk egy response status kódot 
És ezt ugyanígy megcsinálhatjuk itt a bejelentkezes-nél is!! 
Ezt meg egy ilyen chain-eléses megoldással csináljuk meg 
->
    res.status(response.status).redirect("/profile");

És most ha response.success az true, tehát minden jól ment, akkor átírányítunk a profile, ha meg nem, akkor meg vissza a bejelentkezes-re
Tehát mindegyik ágban majd redirect()-elünk, csak az a kérdés, hogy hova redirect-elünk!!!!! 
Szóval nem muszály ezt így megoldani 
->
    if(response.success) {
        res.status(response.status).redirect("/profile");
    } else {
        res.redirect("/bejelentkezes");
    }
hanem lehet így is 
-> 
res.status(response.status).redirect(response.success ? "/profile" : "/bejelentkezes");

Honnan tudjuk, hogy rossz volt a felhasználónév meg a jelszó 
Onnan, hogy csinálunk itt egy olyat, hogy 
bejelentkezes?success=false
-> 
    res.status(response.status).redirect(
        response.success ? "/profile" : "/bejelentkezes?success=false"
    );
Itt most olyan sokmindent nem lehet elrontani, mert van egy felhasználónév meg egy jelszó 
A response-ból megkapjuk ezt, mert a userHandler-en ezt írtuk be message-nek 
-> 
    message: ["Nem megfelelő felhasználónév/jelszó páros!"]
És akkor ezt dobjuk be a url-nek így, hogy 
->
    res.status(response.status).redirect(
        response.success ? "/profile" : `/bejelentkezes?message=${response.message[0]}`
    )

Tehát itt van egy post-os /login kérés, de ez csak az endpoint és itt megadtuk neki, hogy írányítson át minket a bejelentkezes-re 
ha nem sikerült a bejelentkezési folyamat!!! (ha meg igen, akkor meg a profile-ra és azoknak az oldalaknak kész kell lenniük egy get-es)

Na és ha nem tudunk bejelentkezni, akkor megjelenik a message URL kódolt formában 
->
localhost:3000/bejelentkezes?message=A%20bejelentkezés%20szolgáltatás%20jelenleg%20nem%20elérhető%20
de mi nem ezt a message-t akartuk megjeleníteni, hanem, hogy a felhasználónév/jelszó párososat!! 

Meg azt kell csinálni, hogy ezt az URL kódolt változatot vissza kell váltanunk nem URL kódoltra!!! 
app.get("/bejelentkezes", (req, res)=> {
    console.log(req.query);

    res.render("login", {
        layout: "./layouts/public_layout",
        title: "Bejelentkezés",
        page: "bejelentkezes"
    });
});
Ide visz minket ha nem tudunk bejelentkezni és itt mindig nézni kell, hogy mi van a req.query-ben!!!! console.log(req.query)
jelenleg az van benne, hogy -> 
    { message: "A bejelentkezési szolgáltatás nem érhető el"}
Tehát itt rossz lett beletéve, amikor megcsináltunk az url-t -> `/bejelentkezes?message=${response.message[0]}
és mivel itt egy átírányítás történik a app.get("/bejelentkezes" az kap egy req-et ugye és a a query mondja meg, hogy mi van az URL-ben 
mert ez a rész ? ami ez után van az a query!! 

De ez csak, azért volt, hogy a nem megfelelő felhasználó/jelszó páros, mert nem adtuk meg az adatokat(req.body) -> response = uh.login(req.body)

És most a get-es kérésnél ezt akarjuk majd visszaadni, message-nek, hogy tudja a felhasználó, hogy mi a hiba, ne csak az URL-be legyen kiírva
mert onnan nem fogja tudni
->
app.get("/bejelentkezes", (req, res)=> {
    res.render("login", {
        layout: "./layouts/public_layout",
        title: "Bejelentkezés",
        page: "bejelentkezes",
        message: req.query.message ? req.query.message : ""
    });
Láttuk, hogy mi van a req.query-ben egy objektum, aminek a kulcsa az, hogy message és utána meg maga a message -> 
    { message: "A bejelentkezési szolgáltatás nem érhető el"}
De csak akkor van itt egy req.query - hogyha visszaírányitva lettünk ide egy rossz bejelentkezés után, szóval ezt a message-t csak akkor írjuk 
ki, hogy a query meg egyáltalán message az létezik, mert különben, hogyha elöször jövünk ide bejelentkezesre, akkor nincs query meg message-e 
mert nem is szeretnénk, hogy akkor bármit is kiírjunk, csak akkor, hogyha vissza lettünk írányítva és akkor ott lesz egy query-nk meg 
annak megadtunk egy message-t -> 
response.success ? "/profile" : `/bejelentkezes?message=${response.message[0]}`
amit ugye onnan kaptunk meg, hogy a userHandler-en megnézzük, hogy van-e valami hibánk és attól függően itt egy try-catch blokkban 
határozzuk meg, hogy mi legyen a response
-> 
    let response;

    try{
        response = uh.login(req.body);
    } catch(err) {
        response = err;
    }

Megadjuk az adatokat a response = uh.login(req.body) és ha nincs probléma, akkor ez lesz a response, de viszont ha a userHandler-en 
valami probléma van akkor meg az lesz a response 

Ha  rosszul töltjük ki a bejelentkezési adatokat, akkor azt ki is írjuk a login.ejs-re 
-> message: req.query.message ? req.query.message : ""

<h3  class="color-error text-center"><%= message %></h3>
Tehát, amikor rámegyünk a /bejelentkezes-re, akkor ott lesz a felhasználónév meg a jelszó és ha rosszul töltjük ki őket vagy nem írunk be pl. 
semmit, akkor kapunk egy hibaüzenetet felül pirossal 

Ha pedig egy olyannal jelentkeztünk be, ami megtalálható a SQL adatbázisban, akkor meg tovább vit minket a /profile oldalra, de azt még nem
csináltuk meg!! 
Eddig ennyit csináltunk a profile.ejs-en 
<div class="container text-center">
    <h3>Szia <%=userName%>!</h3>

</div>
Itt meg csinálunk egy get-es kérést az index-en 
app.get("/profil", (req, res)=> {
    res.render("profile", {
        layout: "./layouts/private_layout",
        title: "Profil Szerkesztése",
        userName: "Tompika96"
        ->
            ez már a private layout lesz és más menürendszer is lesz itt mert már e vagyunk jelentkezve! 
            az is kér majd egy title-t 
            a profile.ejs meg kér egy userName-t! 
        
private_layout jelenleg így néz ki 
->
<!DOCTYPE html>
<html lang="en">
<%-include("../common/head", {title: title})%>
<body>
    <%-body%>
</body>
</html>

De itt majd felmerül egy probléma, mert annyi felhasználónév, mint felhasználó és itt csak beírtuk egy string-be valamit -> userName: "Tompika96"
Honnan tudjuk a felhasználónak az adatait (pl.userName)
-> 
Onnan fogjuk tudni, hogy vannak ezek a session-ök 
app.use(session({
    secret: "asdf",
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false,
        maxAge: 24*60*60*1000
    }
És ez fogja nekünk megjegyezni ez a session, hogy kiről van szó és nem csak a userName-t (ez a kevésbé fontos), hanem a userID-ját is!!!!! 
Ami fontos, hogy a userHandler login-jében

            const response = await conn.promise().query(
                `SELECT userID, userName FROM users WHERE email = ? AND pass = ?`,
                [user.email, passHash(user.pass)]

Ha jól ment minden, akkor mi itt megkapunk egy userID-t meg egy userName-t 
És ezt vissza is adjuk 
->
if(response[0] === 1) {
    return {
        status: 200,
        message: response[0][0]
    
message: response[0][0] kell, mert a response[0] az még csak az összes rekord és [0][0] az első rekord és mivel itt csak egy rekord lesz ezért!

Tehét itt a message-ben lesz egy userID meg userName!!! 
És ezeket be kell nekünk tenni a session-be, hogyha minden rendben volt!! 
->
app.post("/login", async (req, res)=> {
    let response;

    try{
        response = uh.login(req.body);
        console.log(response);
        req.session.userName = response.message.userName;
        req.session.userID = response.message.userID;

mit kapunk vissza a console.log(response)-ra 
->
{ status: 200 message: { userID: 6, userName: "tompika96@gmail.com"}}
ezért kell, hogy .message userName meg userID legyen!! 
        req.session.userName = response.message.userName;
        req.session.userID = response.message.userID;

És így a profile-nál már tudni kell, hogy mi van a session-ben 
->
app.get("/profil", (req, res)=> {
console.log(req.session.userID) *
itt meg ki is írta, hogy 6!!! mert itt megadtuk neki -> req.session.userID = response.message.userID;

És akkor a render-ben már megszereztük, hogy mi userName és ki is tudjuk írni ehelyett userName: "tompika96" -> userName: req.session.userName
-> 
    res.render("profile", {
        layout: "./layouts/private_layout",
        title: "Profil Szerkesztése",
        userName: req.session.userName,
    })

Megjegyezte a szerver, hogy kik vagyunk, de ha újraindítjuk a szervert, azzal, hogy elmentjük a kódot, akkor újra kell kezdeni (bejelentkezes)
nem fogja megjegyezni a session-be a dolgokat 
Ha újraindul a szerver, akkor biztos, hogy törli a session-öket 

Tehát itt a profil get-es kérésben megkapujuk nem csak a userName-t, hanem a userID-t is (req.session.userID) és akkor majd user adatokat,
felhasználói adatokat, azokat le tudjuk hozni 
És akkor itt a /profil-on lesz majd adatokat tudunk módsítani, amik majd az adatbázisban is módosulni fognak 
(pl. userName, email, pass) meg be is tudjuk írni a firstName-t meg lastName-t, amik jelenleg NULL-ok!!! 

Meg van az adatbázisban egy olyan tábla, hogy addresses, ezt is be tudjuk majd írni és ehhez csinálunk egy külön osztályt!!! 
->
Profile.js 

*/
