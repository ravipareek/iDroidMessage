import applescript
import os
import time

current_path = os.getcwd()

while True:
	message = applescript.run(os.path.join(current_path,"receiveMessage.applescript"), True)
	if message.code != 0 or message.code != "None":
		print("Code: " + str(message.code))
		print("Out: " + str(message.out))
		print("Error: " + str(message.err))