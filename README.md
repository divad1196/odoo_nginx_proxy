# Odoo Proxy

To allow a separate frontend for Odoo, we need to bypass the CORS in Odoo.
Those can be specified individually for each route, otherwise Odoo use the same origin (see [Same Origin Policy](https://developer.mozilla.org/fr/docs/Web/Security/Same-origin_policy)).

We bypass it using an nginx proxy in a docker container.

```bash
# Build the image
docker build --no-cache -t odoo_nginx_proxy .

# Run the new built image
docker run -p 8100:80 -e 'PROXY=https://odoo.myserver.ch' -e 'CORS=https://www.google.com' odoo_nginx_proxy
```

The main 2 environment variables are:

* PROXY: the url to the Odoo server
* CORS: The allowed CORS. By default, this proxy will allow any connection to query the server. This is aimed to allow only your specific service/frontend to query Odoo.



# Odoo Js RPC

Asynchronous implemention of Odoo's rpc

```javascript
let url = "http://localhost:8100";
let db = "my-odoo-database";
let login = "mylogin";
let password = "myverysecretpassword123";

// Build your rpc function once
const rpc = await build_odoo_rpc(url, db, login, password);

// Then Query
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
    (e) => {
        console.log(e);
        console.log("OK");
   	}
).catch(
    (e) => {console.log(e.data.debug);}
);
```

