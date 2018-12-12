
const express = require("express");
const bodyParser = require('body-parser')
const fs = require('fs');
const { exec } = require('child_process');
let app = express();
let port = process.env.PORT | 9001;
let cwd = '/home/ulayera/';

app.use(bodyParser.json());

app.post("/webhooks/github", function (req, res) {
    let event = req.headers['x-github-event'];
    console.log(new Date() + ' - Hook type: ' + event);
    if ('ping' === event) {
        res.sendStatus(200);
    } else if ('push' === event) {
        let repo = req.body.repository.name;
        let branch = req.body.ref.replace('refs/heads/', '');
	let command = `pm2 deploy ${cwd}${repo}.config.js ${branch}`;
        console.log('Command to execute: ' + command);
	let config;
        try {
            config = require(cwd + repo + '.config');
        } catch (e) {}
	if (config && config.apps[0].name === repo && config.deploy[branch]) {
            console.log('Command is supported');
            exec(command, (err, stdout, stderr) => {
                var dt = new Date();
                let date = dt.getFullYear() + "-" + (dt.getMonth() + 1) + "-" + dt.getDate();
                date += "T" + dt.getHours() + ":" + (dt.getMinutes() + 1) + ":" + dt.getSeconds();
                let path = cwd+'logs/'+repo+'/'+branch+'/';
                exec(`mkdir -p ${path}`, (err, stdout, stderr) => {
                    if (err) {
                        fs.writeFile(path+date+'-err.log', err.toString(),
                            (err) => console.error(err)
                        );
                        console.error('Error: see ' + path+date+'-err.log');
                    } else {
                        console.log('Success: see ' + path+date+'-stdout.log');
                    }
                    if (stdout) {
                        fs.writeFile(path+date+'-stdout.log', stdout.toString(),
                            (out) => console.log(out)
                        );
                    }
                    if (stderr) {
                        fs.writeFile(path+date+'-stderr.log', stderr.toString(),
                            (err) => console.error(err)
                        );
                    }
                });
            });
        }
        res.sendStatus(200);
    } else {
         res.status(501).send('Hook type not implemented');
    }
})

app.listen(port, function () {
  console.log('pm2-github-webhook listening on port ' + port + '!');
});
