import fs from 'fs';

const files = fs.readdirSync('./dist/server')

console.log(files);