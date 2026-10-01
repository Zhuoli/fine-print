import {execSync} from 'node:child_process'
import {mkdirSync} from 'node:fs'
mkdirSync('kb', {recursive: true})
execSync('rm -f kb/fine-print-sources.tar.gz && tar -czf kb/fine-print-sources.tar.gz -C sources .', {stdio: 'inherit'})
console.log('wrote kb/fine-print-sources.tar.gz. Upload it as a File source in the Context app.')
