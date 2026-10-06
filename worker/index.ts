import { createClient } from 'redis';
import { spawn } from 'child_process';
import fs from 'fs';
import { prisma } from './db';
import { exitCode } from 'process';


const client = createClient()

client.connect()
  .then(
    async () => {
      while (1) {
        const response = await client.rPop('subscribers');
        if (!response) {
          await new Promise(resolve => setTimeout(resolve, 10000)); // Wait for 10 seconds before checking again
          continue;
        }

        const subscriberResponse = JSON.parse(response);
        const code = subscriberResponse.code;
        const language = subscriberResponse.language;
        const submissionId = subscriberResponse.submissionId;

        console.log(`processing question for subscriber with id ${subscriberResponse.id} `);
        let finalOutput = '';
        if (language === 'py') {
          console.log("processing python code: ", code);

          const filePath = __dirname + '/code/temp.py`';
          fs.writeFileSync(filePath, code);
          const response = spawn('python3', [filePath]);

          response.stdout.on('data', (data) => {
            finalOutput += data.toString();
          });

          await new Promise<void>(resolve => {
            response.on('exit', async () => {
              console.log(`Python process exited with code ${exitCode}`);
              if (exitCode == 0) {
                await prisma.submission.update({
                  where: { id: submissionId },
                  data: { status: 'SUCCESS', output: finalOutput }

                })
              } else {
                response.stderr.on('data', (data) => {
                  console.error(`stderr: ${data}`);
                });
                await prisma.submission.update({
                  where: { id: submissionId },
                  data: { status: 'FAILURE', output: finalOutput }

                })

              }
              resolve();
            })
          })

          response.stderr.on('data', (data) => {
            console.error(`stderr: ${data}`);
          });


          // Here you can add the logic to process the Python code, e.g., execute it, etc.
        }

        else if (language === 'js') {
          const filePath = __dirname + '/code/temp.js';
          console.log("processing javascript code: ", code);
          fs.writeFileSync(filePath, code);
          const response = spawn('node', [filePath]);
          response.stdout.on('data', (data) => {
            finalOutput += data.toString();
          });

          await new Promise<void>(resolve => {
            response.on('exit', async (exitcode) => {
              console.log(`JavaScript process exited with code ${exitcode}`);

              if (exitcode == 0) {
                await prisma.submission.update({
                  where: { id: submissionId },
                  data: { status: 'SUCCESS', output: finalOutput }

                })
              } else {
                response.stderr.on('data', (data) => {
                  console.error(`stderr: ${data}`);
                });
                await prisma.submission.update({
                  where: { id: submissionId },
                  data: { status: 'FAILURE', output: finalOutput }

                })

              }

              resolve();
            })
          })







          await new Promise(resolve => setTimeout(resolve, 5000)); // Simulate processing time
          // Here you can add the logic to process the JavaScript code, e.g., execute it, etc.
        } else if (language === 'c++') {
          console.log("processing c++ code: ", code);
          const filePath = __dirname + '/code/temp.cpp';
          fs.writeFileSync(filePath, code);
          const compileResponse = spawn('g++', [filePath, '-o', __dirname + '/code/temp.out']);

          compileResponse.stdout.on('data', (data) => {
            console.log(`stdout: ${data}`);
          });

          compileResponse.stderr.on('data', (data) => {
            console.error(`stderr: ${data}`);
          });

          await new Promise(resolve => setTimeout(resolve, 5000)); // Simulate compilation time

          const executeResponse = spawn(__dirname + '/code/temp.out');

          executeResponse.stdout.on('data', (data) => {
            finalOutput += data.toString();
          });

          await new Promise<void>(resolve => {
            executeResponse.on('exit', async () => {
              await prisma.submission.update({
                where: { id: submissionId },
                data: { status: 'SUCCESS', output: finalOutput }

              })
              resolve();
            })
          })

          executeResponse.stderr.on('data', (data) => {
            console.error(`stderr: ${data}`);
          });
          // Here you can add the logic to process the C++ code, e.g., execute it, etc.
        } else {
          console.log("Unsupported language: ", language);
        }


        // Here you can add the logic to process the subscriber, e.g., send an email, etc.
      }
    }
  )
  .catch((err) => console.error('Redis connection error:', err));

console.log('Worker is running and waiting for subscribers...');