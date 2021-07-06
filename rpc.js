async function odoo_authenticate(url, database, login, password) {
    headers = new Headers({
        'Content-Type': 'application/json'
    });
    parameters = {
        method: 'POST',
        headers: headers,
        mode: 'cors',  // https://developer.mozilla.org/en-US/docs/Web/API/Request/mode
        // referrerPolicy: "strict-origin-when-cross-origin", // no-referrer
        cache: 'default',
        body: JSON.stringify({
            "jsonrpc": "2.0",
            "id": null,
            "method": "call",
            "params": {
                "db": database,
                "login": login,
                "password": password
            }
        })
    };
    var res = (await fetch(url + "/web/session/authenticate", parameters)).json();
    return res;
}

async function build_odoo_rpc(url, database, login, password) {
    var auth_info = await odoo_authenticate(url, database, login, password);
    var uid = auth_info.result.uid;
    function raw_rpc(model, method, args=[], kwargs={}) {
        headers = new Headers({
            'Content-Type': 'application/json'
        });
        parameters = {
            method: 'POST',
            headers: headers,
            mode: 'cors',  // https://developer.mozilla.org/en-US/docs/Web/API/Request/mode
            // referrerPolicy: "strict-origin-when-cross-origin", // no-referrer
            cache: 'default',
            body: JSON.stringify({
                "jsonrpc": "2.0",
                "id": null,
                "method": "call",
                "params": {
                    "service": "object",
                    "method": "execute_kw",
                    "args": [
                        database,
                        uid,
                        password,
                        model,
                        method,
                        args,
                        kwargs
                    ],
                }
            })
        };
        return fetch(url + "/jsonrpc", parameters);
    }
    async function rpc(model, method, args=[], kwargs={}) {
        return await raw_rpc(model, method, args, kwargs).then(async (response) => {
            let data = await response.json();
            if(data.error) {
                throw data.error;
            }
            return data.result;
        })
    }
    return rpc;
}
let url = "http://localhost:8100";
let db = "";
let login = "";
let password = "";
const rpc = await build_odoo_rpc(url, db, login, password);


rpc(
    "res.partner",
    "search_read",
    [
        [
            ["id", "<", 30]
        ],
        ["id", "name"]
    ],
    {
        limit: 5
    }
).then(
    (e) => {console.log(e); console.log("OK")}
).catch(
    (e) => {console.log(e.data.debug);}
);