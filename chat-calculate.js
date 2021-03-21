/*
   Calculator ignores calculator rolls. Defaults to first damage roll in chat card only. Defaults to only damage by actor, which should be assigned to players.
  /calc N - Calculates last N dice rolls(skips non dice roll messages). Defaults to player's set actor.
  /calc Nsec (or Ns) - Calculates all rolls within last N seconds.
  Other keywords:
  any - Calculates last N dice rolls(skips non-dice roll messages). Includes dice rolls from any source.
  all - Calculates all damage rolls, if a weapon or spell has multiple damage formulas or an Other damage formula.
*/

Hooks.on("chatCommandsReady", function(chatCommands) {

  
  chatCommands.registerCommand(chatCommands.createCommandFromData({
    commandKey: "/calc",
    invokeOnCommand: (chatlog, messageText, chatdata) => {
      console.log("Invoked /calculate");
      //console.log(chatlog, messageText, chatdata);
      //console.log(messageText)
      const numberArray = messageText.match(/\d+/g);
      const N = Number(numberArray[0]);
      let timer = /\d+s|sec/g.test(messageText);
      let any = /any/g.test(messageText); // Set any flag
      let AC = messageText.match(/AC\:\d+/g);
      AC = (AC !== null) ? Number(AC[0].split(':')[1]):false;
      let doMath = messageText.match(/(\-|\+)\d+/g);
    //  let primary = /primary/g.test(messageText); //Set primary flag
      let all = /all/g.test(messageText);
      //let secondary = /secondary/g.test(messageText); //Set secondary flag
      const userId = game.user.data._id;
      const tokenId = canvas.tokens.controlled[0]?.id || false;
      const actorId = canvas.tokens.controlled[0]?.actor?.id || game.user.data.character || false; // Defaults to actor of last message.
      const alias = canvas.tokens.controlled[0]?.actor?.data.name || false;
      console.log('userId: ',userId, 'tokenId: ',tokenId, 'actorId: ',actorId,'alias:',alias);
      console.log('N:',N,'timer:',timer,'any:',any,'all:',all)
      let total = 0;
      let rolls = [];
      let length = game.data.messages.length;
     // console.log('Message Array Length: ',length)
      console.log('AC:',AC)
      console.log('doMath:',doMath)
      //game.data.messages[0].flags.betterrolls5e.entries[2].baseRoll?.total
      /* Cycle through messages looking for damage rolls */
      if(!timer){ // iterate through messages for N dice rolls.

        for(let i=length,x=0;x<N;i--){
         //console.log('total:',total)
          if(i==0) break; // Last message
          let message = game.data.messages[i-1];
          console.log('message: ', message)
         
          /* IGNORE DICE ROLLS IN CALCULATOR MESSAGES */
          if(message.speaker.alias === 'CALCULATOR') continue; 
          /* IGNORE NON DICE ROLL MESSAGES */
          if(message.type !== 5) continue;
          if(!any && message.speaker.actor != actorId) continue; // There's no roll.
          
          /* Roll comes from Better Rolls for 5e */
          if(typeof message.flags.betterrolls5e == 'object'){

            let isHit = (AC == false) ? true:false;
            let damages = 0; 
            message.flags.betterrolls5e.entries.forEach(function(entry,index){
              console.log('item:',entry);
             
              if(entry.rollType =='attack' && !isHit){
                
                /* 
                    Use first roll unless it's ignored which means advantage or disadvantage, 
                    either way if it's not ignored 
                */
                for(let i= 0;i<entry.entries.length;i++){
                  
                  let attack = entry.entries[i];
                  if(attack.ignored) continue;
                  if(AC && (attack.total >= AC || attack.isCrit === true)){
                    isHit = true;
                    break;
                  }
                }
              }
              
              if(entry.type == 'damage-group'){
                entry.entries.forEach(function(roll){

                  if(roll.type == 'damage' && isHit){
                    if(!all && damages > 0) return false;
                    total += roll.baseRoll?.total;
                    rolls.push(roll.baseRoll?.total);
                    damages++;
                    if(roll.critRoll !== null){
                      total += roll.critRoll?.total;
                      rolls.push(roll.critRoll?.total)
                    }
                  }
                })
              }
            })
          }else{
            //if not better rolls
            let isHit = (AC == false) ? true:false;
            let rollData = JSON.parse(message.roll);
            console.log('roll:', rollData)
            if(rollData.terms[0].class === 'Die') { // Single Roll
              /* Check formula to ignore d20 & d100 rolls */
              if(/d(20|100)/g.test(rollData.formula)) continue;
              
              /* Add to total */
              total +=rollData.total;
              rolls.push(rollData.total)
            }else if(rollData.terms[0].class==='DicePool'){ // Multiple Dice, format of Beyond20 Rolls.

              /* Iterate through rolls adding non d20 rolls to total, 
              UNLESS AC keyword is used, then only add if d20 rolls are above AC */
              let skip = false;
              for(let i=0; i < rollData.terms[0].rolls.length;i++){
                let r = rollData.terms[0].rolls[i];
                console.log(r);
                if(/d(20|100)/g.test(r.formula)){ //24 | 14
                  if(!AC || skip) continue;
                  /* First we need to confirm whether to use first or second(or third!) roll */
                  console.log($('[data-message-id="'+message._id+'"]').find('.beyond20-roll-detail-normal')[i])
                  if($('[data-message-id="'+message._id+'"]').find('.beyond20-roll-detail-normal').eq(i).hasClass('beyond20-roll-detail-discarded'))
                    continue;
                  else{
                    console.log(r.total)
                    if(r.total >= AC){
                      isHit = true;
                    }
                    skip = true;
                  }
                }else{
                  /* Dice formula is not d20/100, so it must be damage, right? */
                  console.log(isHit)
                  if(isHit){
                    total += r.total;
                    rolls.push(r.total)
                  }
                  if(!all) break; // exit loop unless ALL keyword is used so that other damage rolls don't get added.
                }
                
              }
            }


            
            
             
          }
          x++;
          //game.data.messages[i].flags.betterrolls5e.entries[2].baseRoll?.total
        }
      }else{ //Timer mode
        let ts = Date.now();
        let cutoff = ts - (N*1000);
       // console.log(ts,cutoff, ts-cutoff)
       // console.log('length', length)
        for(let i = length; i>0; i--){
           if(i==0) break; // Last message
         //  console.log(i);
          let message = game.data.messages[i-1];
         // console.log('message:',message)
          if(message.type !== 5) continue;
          if(message.timestamp < cutoff) break; // Past time cutoff
            if(message.speaker.alias === 'CALCULATOR' || message.speaker.actor != actorId) continue;
           if(typeof message.flags.betterrolls5e == 'object'){

            let isHit = (AC == false) ? true:false;
            let damages = 0; 
            message.flags.betterrolls5e.entries.forEach(function(entry,index){
              console.log('item:',entry);
             
              if(entry.rollType =='attack' && !isHit){
                
                /* 
                    Use first roll unless it's ignored which means advantage or disadvantage, 
                    either way if it's not ignored 
                */
                for(let i= 0;i<entry.entries.length;i++){
                  
                  let attack = entry.entries[i];
                  if(attack.ignored) continue;
                  if(AC && (attack.total >= AC || attack.isCrit === true)){
                    isHit = true;
                    break;
                  }
                }
              }
              
              if(entry.type == 'damage-group'){
                entry.entries.forEach(function(roll){

                  if(roll.type == 'damage' && isHit){
                    if(!all && damages > 0) return false;
                    total += roll.baseRoll?.total;
                    rolls.push(roll.baseRoll?.total);
                    damages++;
                    if(roll.critRoll !== null){
                      total += roll.critRoll?.total;
                      rolls.push(roll.critRoll?.total)
                    }
                  }
                })
              }
            })
          }else{
            
               let rollData = JSON.parse(message.roll);
             // console.log('roll:', rollData)
              //if(rollData.terms[0].class === 'Die' && rollData.terms[0].faces < 20){
                total +=rollData.total;
                rolls.push(rollData.total)
           }
        }
      }
      if(total > 0){
        if(doMath !== null)
          rolls.push(doMath);
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