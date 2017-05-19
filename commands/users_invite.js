'use strict'

const cli = require('heroku-cli-util');
const fs = require('fs');
const co = require('co');
const validator = require('validator');

function * app (context, heroku) {

   var allowedRoles = ["admin","collaborator","member","owner"];

   if(context.flags.team && context.flags.file) {
      var data = fs.readFileSync(context.flags.file).toString();
      var lines = data.split("\n");
      var users = [];
      for(var i in lines) {
         var user={};
         var parts = lines[i].split(",");
         if(parts.length == 2) {
            user.email = parts[0].trim();
            user.role = parts[1].trim();
            if(validator.isEmail(user.email) && allowedRoles.indexOf(user.role) > -1) {
               users.push(user);
            } else {
               cli.warn("Not processing this invalid file line:"+i+":"+lines[i]);
            }
         } else {
            cli.warn("Not processing this invalid file line:"+i+":"+lines[i]);
         }
      }
      // valid users get sent to Heroku
      for(var i in users) {
         let app = yield cli.action('invite user '+users[i].email+' to team '+context.flags.team +' as a '+users[i].role, heroku.request({
               method: 'PUT',
               path: '/teams/'+context.flags.team+'/invitations',
               body: {
                  email: users[i].email,
                  role: users[i].role
               }
            }
         ));
      }
   } else {
      if(!context.flags.team) {
         cli.error("FAILURE : You need to set the -t flag to specifiy which team you are inviting users to.");
      }
      if(!context.flags.file) {
         cli.error("FAILURE : You need to pass a .csv file [email,admin|member] using the -f flag");
      }
   }
}


module.exports = {
   topic: 'demokit',
   command: 'users:invite',
   description: 'Will invite a list of users to the specified team.',
   help: '\
Usage: heroku demokit:users:invite --team <TEAM NAME>\n\n\
If team is ommitted, will revert to your Personal Apps',
   needsAuth: true,
   flags: [
      {name:'team', char:'t', description:'team to invite users to', hasValue:true},
      {name:'file', char:'f', description:'path to csv file that has, per line, (email, [member|admin]) entries', hasValue:true}
   ],
   run: cli.command(co.wrap(app))
}