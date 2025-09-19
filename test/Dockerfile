FROM apify/node:local as builder

COPY . .

RUN echo $(whoami) > /usr/src/app/whoami.txt

FROM apify/node:local

# USER root

# RUN apt update

# USER myuser

COPY --from=builder /usr/src/app/whoami.txt ./whoami.txt

RUN echo $(whoami)

ENV MY_ENV=index.js

CMD ./start_xvfb_and_run_cmd.sh && node "${MY_ENV}"
