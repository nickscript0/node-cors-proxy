FROM node:9-alpine

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY package*.json ./

# The following line could be eliminated if we made the tsconfig.json compile to a single file
RUN npm install
# If you are building your code for production
# RUN npm install --only=production

COPY dist/ ./dist/

EXPOSE 8080
CMD [ "npm", "start" ]