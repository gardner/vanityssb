# vanityssb
Crude discovery of vanity public keys that start with the specified text (case-insensitive). Four character vanity keys are easy to discover in less than a minute. Every additional character adds an exponential level of complexity.

![system load while running](https://github.com/gardner/vanityssb/raw/master/htop.png)

### Important:
After a key is found the result files must be deleted before another key search: `rm done.txt key*`

Usage: `node ./index.js <string>`
If no string is specified then $USER is used. The time to find a key grows exponentially with every character added to length of string. The program exits almost immediately when passed a single character. Within seconds when run accidentally as 'root' and does not finish after multiple hours when run with a 7 character string 'gardner'.

This design was the easiest to implement. No regard for optimization has been considered. Using the same npm lib as the system, we are guaranteed compatibility. After preliminary research into generating ed25519 by other means it was determined that verifying compatibility would be as complex as implementing this design. (X2)

Running on C2L (8 core x86) instance provided by Scaleway:

    root@scw-0ad696:~/test# node ./index.js gardner
    Master 4966 is running
    Finding vanity public key for gardner
    tick[127]: avg[47439] ~ kps[47828] = secs[381] / tested[18230k]

Running on an Intel i7-4870HQ CPU @ 2.50GHz

    $ node ./index.js gardner
    Master 10645 is running
    Finding vanity public key for gardner
    tick[135]: avg[72055] ~ kps[69089] = secs[405] / tested[28010k]

Tests were conducted with node v6