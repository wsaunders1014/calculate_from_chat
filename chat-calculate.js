/*
  Ignores d20 and higher rolls.
  /calc N - Calculates last N dice rolls(skips non dice roll messages). Defaults to player's set actor.
  /calc Nsec - Calculates all rolls within last N seconds.
  Other keywords:
  any - Calculates last N dice rolls(skips non-dice roll messages). Includes dice rolls from any source.
  primary - Ignores secondary damages in same message. Ie if a versatile weapon is set to show both damages.
  secondary - Ignores primary damages if more than two.
*/

Hooks.on("chatCommandsReady", function(chatCommands) {

  
  chatCommands.registerCommand(chatCommands.createCommandFromData({
    commandKey: "/calc",
    invokeOnCommand: (chatlog, messageText, chatdata) => {
      console.log("Invoked /calculate");
      console.log(chatlog, messageText, chatdata);
     
      const N = Number(messageText.match(/\d+/g)[0]);
      let timer = /\d+s|sec/g.test(messageText);
      let any = /any/g.test(messageText); // Set any flag
      let primary = /primary/g.test(messageText); //Set primary flag
      let all = /all/g.test(messageText);
      //let secondary = /secondary/g.test(messageText); //Set secondary flag
      const userId = game.user.data._id;
      const tokenId = canvas.tokens.controlled[0]?.id || game.data.messages[game.data.messages.length-1].speaker.token;
      const actorId = canvas.tokens.controlled[0]?.actor?.id || game.user.data.character || game.data.messages[game.data.messages.length-1].speaker.actor; // Defaults to actor of last message.
      const alias = game.data.messages[game.data.messages.length-1].speaker.alias;
      console.log('userId: ',userId, 'tokenId: ',tokenId, 'actorId: ',actorId);
      console.log('N:',N,'timer:',timer)
      let total = 0;
      let rolls = [];
      let length = game.data.messages.length;
      console.log('Message Array Length: ',length)
      
       
      //game.data.messages[0].flags.betterrolls5e.entries[2].baseRoll?.total
      /* Cycle through messages looking for damage rolls */
      if(!timer){ // iterate through messages for N dice rolls.

        for(let i=length,x=0;x<N;i--){
         console.log('total:',total)
          if(i==0) break; // Last message
          let message = game.data.messages[i-1];
           console.log('message: ', message)
           console.log(message.speaker.alias === 'CALCULATOR', message.speaker.actor != actorId)
          if(message.speaker.alias === 'CALCULATOR') continue;
          console.log('any:',any)
          if(!any && message.speaker.actor != actorId) continue; // There's no roll.
          // Add message to number of messages to calculate.
          
          if(typeof message.flags.betterrolls5e == 'object'){
            console.log('test')
             //if better rolls
              let damages = 0;
               message.flags.betterrolls5e.entries.forEach(function(item,index){
                if(item.type == 'damage'){
                 // console.log(item.baseRoll?.total)
                  if(!all && damages > 0) return false;
                  total += item.baseRoll?.total;
                  rolls.push(item.baseRoll?.total)
                  if(item.critRoll !== null){
                    total += item.critRoll?.total;
                    rolls.push(item.critRoll?.total)
                  }
                  damages++;
                }
               })
             
           }else{
            //if not better rolls
             // if(message.speaker.alias === 'CALCULATOR') continue;
              let rollData = JSON.parse(message.roll);
              console.log('roll:', rollData)
              //if(rollData.terms[0].class === 'Die' && rollData.terms[0].faces < 20){
                total +=rollData.total;
                rolls.push(rollData.total)
             // }
             
           }
          x++;
          //game.data.messages[i].flags.betterrolls5e.entries[2].baseRoll?.total
        }
      }else{ //Timer mode
        let ts = Date.now();
        let cutoff = ts - (N*1000);
        console.log(ts,cutoff, ts-cutoff)
        console.log('length', length)
        for(let i = length; i>0; i--){
           if(i==0) break; // Last message
           console.log(i);
          let message = game.data.messages[i-1];
          console.log('message:',message)
          if(message.timestamp < cutoff) break; // Past time cutoff
            if(message.speaker.alias === 'CALCULATOR' || message.speaker.actor != actorId) continue;
           if(typeof message.flags.betterrolls5e == 'object'){
              
              let damages = 0;
               message.flags.betterrolls5e.entries.forEach(function(item,index){
                if(item.type == 'damage'){
                 // console.log(item.baseRoll?.total)
                  if(primary && damages > 0) return false;
                  total += item.baseRoll?.total;
                  rolls.push(item.baseRoll?.total)
                  if(item.critRoll !== null){
                    total += item.critRoll?.total;
                    rolls.push(item.critRoll?.total)
                  }
                  damages++;
                }
               })
           }else{
               let rollData = JSON.parse(message.roll);
              console.log('roll:', rollData)
              //if(rollData.terms[0].class === 'Die' && rollData.terms[0].faces < 20){
                total +=rollData.total;
                rolls.push(rollData.total)
           }
        }
      }
      if(total > 0){
        console.log('Total:',total, rolls)
        let rollTxt = rolls.join('+');
        console.log(rollTxt)
        let totalRoll = new Roll(rollTxt).roll()
        ChatMessage.create({
          speaker: {actor:actorId,token:null,alias:'CALCULATOR'},
          type: CONST.CHAT_MESSAGE_TYPES.ROLL,
          isRoll:true,
          roll: totalRoll
        });

     }
      
    },
    shouldDisplayToChat: false,
    iconClass: "fa-calculator",
    description: "Calculate total from last N rolls",
    gmOnly: false
  }));


  //chatCommands.registerCommand(command);

  // Actually, deregister it
  //chatCommands.deregisterCommand(command);
});