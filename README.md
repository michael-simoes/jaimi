# Jaimi is a virtual assistant that writes follow-up emails for you 
Activate the chase sequence in the console to have Jaimi monitor your most recently sent email. If you do not receive a reply from the email you contacted, Jaimi will draft and send a message from your inbox. 

A follow-up sequence is referred to in the app as a "chase" because you are chasing someone until you get a reply. The default follow-up period is every 3 business days (holidays are ignored).

Jaimi can monitor and chase down as many email recipients as your email provider allows open IMAP connections. Gmail seems to be unlimited. Just tell Jaimi anytime you've sent an email to someone who will need to be chased for a reply. 

If Jaimi receives an email from a particular recipient, the chase sequence for that recipient will be aborted. There can be only one chase sequence per unique email. (If you need to follow-up with someone for two indepedent things at once, all hope is probably lost.) 

Jaimi has been tested for Outlook and Gmail.

## Configuring IMAP connection
Jaimi connects to your email provider via IMAP (for reading) and uses SMTP for sending. Multi-factor auth for an email currently breaks the IMAP connection but this could be fixed in a later update. 

Gmail may require you to create a dedicated password for the Gmail account that is separate from the Google account. This way, Jaimi does not have access to your entire Google account (only the emails). 

## Errors and issues
Jaimi establishes a new connection to your inbox for each email that is potentially being followed up. Is this a good design? No, but it was easier for me to write this way. 

If Jaimi encounters an issue, such as failing to establish a connection with your inbox, Jaimi will abort the chase sequence for the email that caused the connection to fail. Eg., if Jaimi needs to monitor bubba@shrimp.com but fails to connect to the email server, Jaimi will not try to follow-up with Bubba. In this case, an existing recipient who has been marked for follow-ups forest@tree.com would be unaffected and can still be emailed by Jaimi. 

Attachments, images, and super (duper) long emails are not currently supported by Jaimi and they will be declined to be read. 

The vast majority of issues with getting Jaimi to run revolve around the failure to connect (and stay connected) to an email server. This includes: 
* failure to authenticate with the email provider (like getting blocked as a new sign-in attempt)
* having the incorrect IMAP configuration (wrong port, domain, tls setting, or something else)
* honestly, those are the main ones and comedy comes in threes
