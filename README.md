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





### Explaination

Here is the nginx configuration to use.
Nb: This must be used **before the encryption** with SSL/TLS (HTTPS), you either need:

* http access to your Odoo server
* To handle decryption and re-encryption with another certificate on the proxy

If you already have an nginx providing the encryption, and you have access to it, you can add the following to the existing configuration.

```nginx
server {
    listen ${PORT};
    server_name_in_redirect off;

    access_log  /var/log/nginx/access.log;
    error_log  /var/log/nginx/error.log debug;

    location / {
        proxy_pass ${PROXY};
        proxy_set_header Origin ${ORIGIN};


        # proxy_set_header is to set a request header
        # add_header is to add header to response
        # proxy_hide_header is to hide a response header

        proxy_hide_header Access-Control-Allow-Origin;  # Hide the existing header if defined
        add_header Access-Control-Allow-Origin ${CORS} always;
        add_header Access-Control-Allow-Methods 'POST, GET' always;
        add_header 'Access-Control-Allow-Credentials' 'true' always;
        add_header Access-Control-Max-Age: 86400 always;  # 60 * 60 * 24;
        add_header Access-Control-Allow-Headers: 'Origin, X-Requested-With, Content-Type, Accept, Authorization, X-Debug-Mode' always;

        if ($request_method = 'OPTIONS') {
            add_header 'Access-Control-Allow-Origin' ${CORS};
            add_header 'Access-Control-Allow-Methods' 'POST, GET' always;
            add_header 'Access-Control-Allow-Credentials' 'true' always;
            #
            # Custom headers and headers various browsers *should* be OK with but aren't
            #
            add_header 'Access-Control-Allow-Headers' 'Origin, X-Requested-With, Content-Type, Accept, Authorization, X-Debug-Mode' always;
            #
            # Tell client that this pre-flight info is valid for 20 days
            #
            add_header 'Access-Control-Max-Age' 86400;
            add_header 'Content-Type' 'text/plain; charset=utf-8';
            add_header 'Content-Length' 0;
            return 204;
        }
    }
}
```

There is 3 variables:

* PORT: the port on which odoo is running (by default, 8069)
* PROXY: the url where Odoo is running
* CORS: the url authorized to query your Odoo (may be a wildcard but shouldn't in production)
  Nb: This allow either 1 or all website, if you want to allow more you will need some condition checks



Be aware:

* The following headers must be set and **NOT** be using the wildcard

  * Access-Control-Allow-Origin
  * Access-Control-Allow-Methods
  * Access-Control-Allow-Headers

* You will probably need to deal with creadentials, the following header value must be "true"
  Access-Control-Allow-Credentials: true

* fetch (in javascript) won't allows cors and credentials by default

  ```js
  credentials: 'include',
  mode: 'cors',  // https://developer.mozilla.org/en-US/docs/Web/API/Request/mode
  ```

  



