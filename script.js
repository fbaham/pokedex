// Variables
var pokemonList = document.getElementById("pokemonList");

var data = document.getElementById("data");

var cry = document.getElementById("cry");

var area = document.getElementById("area");

var quit = document.getElementById("quit");

var pokemonListIsSelected = false;

// Funciones
function ajax(url, opciones) {
    //parametros pasados
    opciones = opciones || {};
    if (typeof url === "object" && url !== null) {
        opciones = url; //url como param o como propiedad
        url = opciones.url;
    }
    url = url || "";
    opciones.method = opciones.method || opciones.type || "GET";
    opciones.method = opciones.method.toUpperCase();

    function crearObjetoXMLHttp() {
        //Crear el objeto para el HTTP request
        if (typeof XMLHttpRequest !== "undefined")
            return new XMLHttpRequest();
        else { //para IE6-
            const XMLHttpVersions = [
                "MSXML2.XmlHttp.6.0",
                "MSXML2.XmlHttp.5.0",
                "MSXML2.XmlHttp.4.0",
                "MSXML2.XmlHttp.3.0",
                "MSXML2.XmlHttp.2.0",
                "Microsoft.XmlHttp"
            ];
            const XMLHttpVersionsLength = XMLHttpVersions.length;
            for (var i = 0; i < XMLHttpVersionsLength; i++) {
                try {
                    return new ActiveXObject(XMLHttpVersions[i]);
                } catch (e) { }
            }

            throw new ReferenceError("No se puede crear una instancia para el objeto XMLHttpRequest");
        }
    }
    var http_request;
    if (typeof opciones.xhr === 'function')
        http_request = opciones.xhr()
    else
        http_request = crearObjetoXMLHttp();

    //asignamos una función que se llamara (asincronicamente) 
    //  cuando cambie el estado de la petición
    function respuestaAJAX() {
        if (http_request.readyState == (XMLHttpRequest.DONE || 4)) { // 4 significa que terminó
            var status;
            if (http_request.status >= 200 && http_request.status < 300 || http_request.status == 304) { //2xx Success
                //aca leemos la respuesta (lel recurso devuelto)
                // y se llama al callback definido por el usuario
                status = "success";
                statusAJAX(http_request, status);
                if (typeof opciones.success === "function") {
                    var response;
                    try {
                        if (opciones.dataType == "json") { //si se espera un json
                            response = JSON.parse(http_request.response);
                            response.__proto__.toString = function () { return JSON.stringify(this) };
                        } else if (opciones.dataType == "xml") { //si se espera un xml
                            response = http_request.responseXML;
                            response.__proto__.toString = function () { return this.innerHTML };
                        } else { //si se espera texto
                            response = http_request.response;
                        }
                        // Callback a success
                        opciones.success(response);
                        completoAJAX(http_request, status);
                    } catch (err) { //error al interpretar json o xml
                        console.error(err);
                        if (typeof opciones.error === "function") {
                            status = "parseerror";
                            errorAJAX(http_request, status);
                        }
                    }
                }
            } else if (http_request.responseURL !== "") {  //Otra respuesta (ej: 500 Internal Server Error)
                status = "error";
                statusAJAX(http_request, status);
                //lanzar error
                errorAJAX(http_request, status);
            }
        }
    }
    addEvent(http_request, "readystatechange", respuestaAJAX);


    function errorAJAX(http_request, status) {
        //llamamos al callback the "error" si se especifico
        status = status || "error";
        if (typeof opciones.error !== "undefined") {
            var statusText = (http_request.statusText || "").replace(/^\d+ /, "");
            if (typeof opciones.error === "function")
                opciones.error = [opciones.error];
            var errorLength = opciones.error.length;
            for (var i = 0; i < errorLength; i++) {
                opciones.error[i](http_request, status, statusText);
            }
        }
        completoAJAX(http_request, status);
    }

    function statusAJAX(http_request, status) {
        //si se definio por ej, statusCode: { 500: function(){ /* */ } }
        if (typeof opciones.statusCode === "object" && typeof opciones.statusCode[http_request.status] === "function")
            opciones.statusCode[http_request.status](http_request, status, (http_request.statusText.replace(/^\d+ /, "") || ""));
    }

    function completoAJAX(http_request, status) {
        //llamamos al callback the "complete" si se especifico
        if (typeof opciones.complete !== "undefined") {
            if (typeof opciones.complete === "function")
                opciones.complete = [opciones.complete];
            var completeLength = opciones.complete.length;
            for (var i = 0; i < completeLength; i++) {
                opciones.complete[i](http_request, status);
            }
        }
    }

    //handlers para los errores
    const ajaxErrorEvents = ["abort", "error", "timeout"];
    const ajaxErrorEventsLength = ajaxErrorEvents.length;
    for (var i = 0; i < ajaxErrorEventsLength; i++) {
        const ajaxErrorEvent = ajaxErrorEvents[i];
        addEvent(http_request, ajaxErrorEvent, function () {
            errorAJAX(http_request, ajaxErrorEvent);
        });
    }

    function addEvent(elemento, evento, callback, arg) {
        if (elemento.addEventListener) { //addEventListener
            elemento.addEventListener(evento, callback, (arg || false));
        } else if (elemento.attachEvent) { //attachEvent para IE
            elemento.attachEvent("on" + evento, callback);
        } else {
            elemento["on" + evento] = callback;
        }
    }

    //timeout
    if (typeof opciones.timeout !== "undefined")
        http_request.timeout = opciones.timeout;

    //preparamos los datos a enviar
    var data = null;
    if (typeof opciones.data !== "undefined" && (opciones.data !== null || opciones.cache === false)) {
        if (opciones.processData === false) {
            data = opciones.data;
        } else if (typeof opciones.data === "string") {
            data = encodeURI(opciones.data.replace(/^\?/, ""));
        } else if (typeof opciones.data === "object") {
            var dataArr = [];
            for (var key in opciones.data) {
                if (Object.prototype.hasOwnProperty.call(opciones.data, key)) {
                    dataArr[dataArr.length] = encodeURIComponent(key) + "="
                        + encodeURIComponent(typeof opciones.data[key] === "string"
                            ? opciones.data[key]
                            : JSON.stringify(opciones.data[key]));
                }
            }
            data = dataArr.join("&");
        }
        //Si es GET, data va en el query del uri
        if (opciones.method == "GET") {
            if (opciones.cache === false) //no usar cache
                data += (data ? "?" : "") + "_=" + (Date.now ? Date.now() : new Date().getTime());
            url += "?" + data;
            data = null;
        }
    }

    //hacemos el request
    http_request.open(opciones.method, url, true, opciones.username, opciones.password);
    //forms
    if (opciones.method == "POST" || opciones.method == "PUT")
        http_request.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
    //completamos encabezados
    for (var encabezado in opciones.headers) {
        if (Object.prototype.hasOwnProperty.call(opciones.headers, encabezado))
            http_request.setRequestHeader(encabezado.replace(/(?:^([a-z])|([a-z]))([a-z0-9_]*)([A-Z]+)/g,
                function (m, p1, p2, p3, p4) { return (p1 ? p1.toUpperCase() : p2) + p3 + "-" + p4 }),
                opciones.headers[encabezado]);
    }
    //dataType y contentType
    if (opciones.dataType == "xml") {
        http_request.setRequestHeader("Accept", "text/xml; charset=UTF-8");
    } else if (opciones.dataType == "json") {
        http_request.setRequestHeader("Accept", "application/json; charset=UTF-8");
    }
    if (typeof opciones.contentType !== "undefined") { //Content-Type x usuario
        http_request.overrideMimeType(opciones.contentType);
        http_request.setRequestHeader("Content-Type", opciones.contentType);
    }
    //beforeSend
    if (typeof opciones.beforeSend === "function") {
        if (opciones.beforeSend(http_request, opciones) === false) {
            http_request.abort();
            return false;
        }
    }
    //send
    http_request.send(data);
    return true;
}

// Fill #pokemonList
ajax({
    url: "https://pokeapi.co/api/v2/generation/1",
    method: "GET",
    dataType: "json",
    success: (d) => {
        for (const pokemon in d.pokemon_species) {
            if (d.pokemon_species.hasOwnProperty(pokemon)) {
                const element = d.pokemon_species[pokemon];
                let res = document.querySelector("#pokemonList");
                res.innerHTML += `<li value="${element.url}">${element.name}</li>`;
                console.log(element.url.split("/"));
            }
        }
    }
});

//Events

// This handler will be executed every time the cursor
// is moved over a different list item
pokemonList.addEventListener("mouseover", function (event) {
    // if pokemonList has a selected pokemon break this
    if (pokemonListIsSelected) {
        return 0;
    }
    // highlight the mouseover target
    event.target.style.backgroundColor = "rgba(255, 255, 255, 0.8)";
}, false);

// This handler will be executed every time the cursor
// is moved out from list item
pokemonList.addEventListener("mouseout", function (event) {
    // if pokemonList has a selected pokemon break this
    if (pokemonListIsSelected) {
        return 0;
    }
    // reset the color after a short delay
    setTimeout(function () {
        event.target.style.backgroundColor = "";
    }, 300);
}, false);

// This handler will be executed every time the cursor
// is moved over a different list item
data.addEventListener("mouseover", function (event) {
    // if pokemonList has a selected pokemon break this
    if (!pokemonListIsSelected) {
        return 0;
    }
    // highlight the mouseover target
    event.target.style.backgroundColor = "rgba(255, 255, 255, 0.8)";
}, false);

// This handler will be executed every time the cursor
// is moved out from list item
data.addEventListener("mouseout", function (event) {
    // if pokemonList has a selected pokemon break this
    if (!pokemonListIsSelected) {
        return 0;
    }
    // reset the color after a short delay
    setTimeout(function () {
        event.target.style.backgroundColor = "";
    }, 300);
}, false);

// This handler will be executed every time the cursor
// is moved over a different list item
cry.addEventListener("mouseover", function (event) {
    // if pokemonList has a selected pokemon break this
    if (!pokemonListIsSelected) {
        return 0;
    }
    // highlight the mouseover target
    event.target.style.backgroundColor = "rgba(255, 255, 255, 0.8)";
}, false);

// This handler will be executed every time the cursor
// is moved out from list item
cry.addEventListener("mouseout", function (event) {
    // if pokemonList has a selected pokemon break this
    if (!pokemonListIsSelected) {
        return 0;
    }
    // reset the color after a short delay
    setTimeout(function () {
        event.target.style.backgroundColor = "";
    }, 300);
}, false);

// This handler will be executed every time the cursor
// is moved over a different list item
area.addEventListener("mouseover", function (event) {
    // if pokemonList has a selected pokemon break this
    if (!pokemonListIsSelected) {
        return 0;
    }
    // highlight the mouseover target
    event.target.style.backgroundColor = "rgba(255, 255, 255, 0.8)";
}, false);

// This handler will be executed every time the cursor
// is moved out from list item
area.addEventListener("mouseout", function (event) {
    // if pokemonList has a selected pokemon break this
    if (!pokemonListIsSelected) {
        return 0;
    }
    // reset the color after a short delay
    setTimeout(function () {
        event.target.style.backgroundColor = "";
    }, 300);
}, false);

// This handler will be executed every time the cursor
// is moved over a different list item
quit.addEventListener("mouseover", function (event) {
    // if pokemonList has a selected pokemon break this
    if (!pokemonListIsSelected) {
        return 0;
    }
    // highlight the mouseover target
    event.target.style.backgroundColor = "rgba(255, 255, 255, 0.8)";
}, false);

// This handler will be executed every time the cursor
// is moved out from list item
quit.addEventListener("mouseout", function (event) {
    // if pokemonList has a selected pokemon break this
    if (!pokemonListIsSelected) {
        return 0;
    }
    // reset the color after a short delay
    setTimeout(function () {
        event.target.style.backgroundColor = "";
    }, 300);
}, false);

pokemonList.addEventListener("click", event => {
    // if pokemonList has a selected pokemon break this
    if (pokemonListIsSelected) {
        return 0;
    } else {
        pokemonListIsSelected = true;
        event.target.style.backgroundColor = "rgba(0, 0, 0, 0.5)";
    }
    // console.log(event.path[0].innerHTML);
});

quit.addEventListener("click", event => {
    // if pokemonListIsSelected is true break this
    if (pokemonListIsSelected) {
        pokemonListIsSelected = false;
        pokemonList.style.backgroundColor = "";
        event.target.style.backgroundColor = "";
        event.target.parentElement.style.backgroundColor = "";
    } else {
        return 0;
    }
});