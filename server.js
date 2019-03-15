'use strict';

const fs = require('fs');
const Hapi = require('hapi');

const server = Hapi.server({
    host: 'localhost',
    port: 3000,
    routes: { cors: { origin: ['*'] } }
});

const USERNAME = process.env.APP_USERNAME || 'admin';
const PASSWORD = process.env.APP_PASSWORD || 'X';
const SUBFOLDER = './events';

if (!fs.existsSync(SUBFOLDER)){
    fs.mkdirSync(SUBFOLDER);
}

const validate = (request, username, password) => {
    const isValid = username == USERNAME && password == PASSWORD;

    return { isValid, credentials: {} };
};

const verifyPath = (filename) => {
    return !filename.includes('/');
};

const start =  async function() {
    await server.register(require('inert'));
    await server.register(require('hapi-auth-basic'));
    server.auth.strategy('simple', 'basic', { validate });

    server.route({
        method: 'POST',
        path: '/events/{eventType}',
        options: {
            auth: 'simple'
        },
        handler: (request, h) => {
            const { eventType } = request.params;
            if (!verifyPath(eventType)) {
                return '';
            }

            fs.appendFileSync(
                `${SUBFOLDER}/${eventType}.jsonl`,
                JSON.stringify(request.payload) + '\n'
            );

            return { success: true };
        }
    });


    server.route({
        method: 'GET',
        path: '/events/{filename}',
        options: {
            auth: 'simple'
        },
        handler: {
            file: (request) => {
                const { filename } = request.params;
                if (!verifyPath(filename)) {
                    return '';
                }
                return `${SUBFOLDER}/${filename}`;
            }
        }
    });

    try {
        await server.start();
    }
    catch (err) {
        console.log(err);
        process.exit(1);
    }

    console.log('Server running at:', server.info.uri);
};

start();
