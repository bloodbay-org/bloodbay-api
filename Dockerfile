FROM node:16

WORKDIR /usr/src/app

COPY . .

RUN yarn install

#RUN yarn test-ci

EXPOSE 8080

CMD [ "yarn", "start" ]
