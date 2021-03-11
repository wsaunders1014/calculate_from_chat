# Calculate From Chat

This is a simple module that relies on the Chat Commands module as a dependency. It adds a /calc command to chat, to allow players and GMs to calculate the total roll for multiple chat cards... Useful for when your level 11 munchkin rolls 3 sharpshooter attacks with hunter's mark and an undead damage rider.

Usage: 
/calc N - Calculates last N rolls.
/calc Ns - Calculates all rolls within last N seconds.

It defaults to the user's attached Actor, so make sure player's have an attached actor and if you're a GM, have a token selected. It also defaults to only primary damage rolls and ignores other damage formulas.

There are additional keywords:
all - adds all damage rolls to calculation. So if your weapon does 1d10 Slashing and has a 1d6 other formula, it will include both rolls.
any - adds rolls from any source. Mostly useful for GM so you don't have to select a token first. 

Examples:

/calc 3 all - Will calculate all damage rolls in last 3 cards from actor.

/calc 30s any - Will calculate rolls from any actor or roll in the last 30 seconds.