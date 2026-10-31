import {
  type AccountLabels,
  type BookingFormat,
  type BookingLabels,
  defaultShopProduct,
  type ShopArticle,
} from "@shopvento/ui";

// Temporary @shopvento/ui English overrides. Remove when the package ships English.
// German keys and numbered placeholders are part of the package message contract.
export const englishMessages: Record<string, string> = {
  "Noch {0} bis zum kostenlosen Versand": "{0} away from free delivery",
  "Kostenloser Versand": "Free delivery",
  "Noch ": "Only ",
  " bis zum kostenlosen Versand.": " until free delivery.",
  "Fortschritt bis zum kostenlosen Versand": "Progress towards free delivery",
  "Preise werden geprüft": "Checking prices",
  "Du hast gerade viele Anfragen gesendet. Warte kurz und versuche es erneut.":
    "You have sent too many requests. Please wait a moment and try again.",
  "Bitte melde Dich an, um Deine Bestellung fortzusetzen.":
    "Please sign in to continue your order.",
  "Das hat gerade nicht geklappt. Versuch es bitte noch einmal. Dein Warenkorb bleibt erhalten.":
    "Something went wrong. Please try again. Your cart has been saved.",
  "Deine Zahlung wird geprüft.": "Your payment is being checked.",
  "Deine Bestellung ist noch unvollständig.": "Your order is incomplete.",
  "Deine Bestellung ist bezahlt.": "Your order has been paid.",
  "Deine Bestellung wird vorbereitet.": "Your order is being prepared.",
  "Deine Bestellung ist abgeschlossen.": "Your order is complete.",
  "Deine Bestellung wurde storniert.": "Your order has been cancelled.",
  "Deine Zahlung ist fehlgeschlagen.": "Your payment failed.",
  "Deine Bestellung wurde erstattet.": "Your order has been refunded.",
  "Deine Zahlung wird geklärt.": "Your payment is under review.",
  "Die Zahlung wurde zurückgebucht.": "The payment has been charged back.",
  "Deine Bestellung wurde teilweise storniert.":
    "Your order has been partially cancelled.",
  "Deine Bestellung wurde zurückgegeben.": "Your order has been returned.",
  "Deine Bestellung wurde teilweise zurückgegeben.":
    "Your order has been partially returned.",
  "Wir prüfen Deine Bestellung und melden uns.":
    "We are reviewing your order and will be in touch.",
  "Deine Zahlung wurde erstattet.": "Your payment has been refunded.",
  "Wir erstatten Deine Zahlung.": "We are refunding your payment.",
  "Artikel werden geladen.": "Loading products.",
  "Diesen Artikel gibt es gerade nicht online.":
    "This product is currently unavailable online.",
  "Dein Warenkorb wurde an das aktuelle Online-Sortiment angepasst.":
    "Your cart has been updated to match the current online range.",
  "Ein Artikel konnte nicht bestätigt werden. Bitte prüfe Deinen Warenkorb.":
    "A product could not be confirmed. Please check your cart.",
  "{0} liegt im Warenkorb.": "{0} is in your cart.",
  "inkl. MwSt., Abholung oder Lieferung": "incl. VAT, collection or delivery",
  "inkl. MwSt., Abholung": "incl. VAT, collection",
  "inkl. MwSt., zzgl.": "incl. VAT, plus",
  Versand: "Delivery",
  "Auswahl öffnen": "Open options",
  "in den Warenkorb": "add to cart",
  "Dein Einkauf": "Your shopping",
  Zwischensumme: "Subtotal",
  "Gutschein per E-Mail": "Voucher by email",
  "Versand (DHL)": "Delivery (DHL)",
  Lieferung: "Delivery",
  "Click & Collect": "Click & Collect",
  Gutscheine: "Vouchers",
  "Gesamt ab": "Total from",
  Gesamt: "Total",
  "Beim Kauf eines Gutscheins fällt noch keine Umsatzsteuer an, sie entsteht erst bei der Einlösung.":
    "VAT is charged when the voucher is redeemed, rather than when it is purchased.",
  "Inklusive MwSt.": "Including VAT",
  "Erneut prüfen": "Check again",
  "Preise werden geprüft.": "Checking prices.",
  "Du erhältst Deine Gutscheine per E-Mail.":
    "Your vouchers will arrive by email.",
  "Wir liefern nur innerhalb Deutschlands.": "We only deliver within Germany.",
  "Zahlungsarten:": "Payment methods:",
  "Deine Bestellung": "Your order",
  Übersicht: "Overview",
  Ändern: "Change",
  " Artikel": " in total",
  "Deine Wünsche: ": "Your requests: ",
  "Für schnell verderbliche frische Ware besteht kein Widerrufsrecht.":
    "Cancellation rights do not apply to perishable fresh goods.",
  "Nach Entfernen der Versiegelung erlischt das Widerrufsrecht bei geeigneter versiegelter Ware.":
    "Cancellation rights for applicable sealed goods end when the seal is removed.",
  Liefertermin: "Delivery date",
  Abholtermin: "Collection date",
  Zahlungsarten: "Payment methods",
  "Enthält Alkohol: Abgabe nur an Personen ab 18 Jahren.":
    "Contains alcohol: only available to people aged 18 or over.",
  "Versand und Abholung": "Delivery and collection",
  "Ein Artikel ist nicht mehr im Sortiment.":
    "A product is no longer available.",
  "Artikel entfernen": "Remove product",
  "Abholung oder Lieferung": "Collection or delivery",
  "Nur Abholung": "Collection only",
  " Stück ·": " items ·",
  "Menge {0}": "Quantity {0}",
  "Lieferung oder Abholung": "Delivery or collection",
  "Versand oder Abholung": "Delivery or collection",
  "Versand mit DHL": "Delivery with DHL",
  "Frische Ware erhältst Du nur per Click & Collect.":
    "Fresh goods are only available through Click & Collect.",
  "DHL Alterssichtprüfung 18+: bitte halte Deinen Ausweis bereit. Keine Packstation.":
    "DHL age check (18+): please have your ID ready. No parcel lockers.",
  "Wir prüfen das Alter bei der Übergabe (18+). Bring bitte Deinen Ausweis mit.":
    "We check your age at handover (18+). Please bring your ID.",
  "Bei der Abholung prüfen wir Dein Alter. Bitte bring Deinen Ausweis mit.":
    "We check your age at collection. Please bring your ID.",
  "Deine Gutscheine erhältst Du per E-Mail. Kein Versand und keine Abholung nötig.":
    "Your vouchers arrive by email. No delivery or collection required.",
  "Bitte wähle einen Termin": "Please choose a date",
  "Zurzeit ist kein Termin verfügbar.": "No dates are currently available.",
  "Prüfe Deine Lieferdaten.": "Check your delivery details.",
  "Die Bestellprüfung ist noch nicht eingerichtet. Bitte kontaktiere uns vor Deiner Bestellung.":
    "Order review is not configured yet. Please contact us before ordering.",
  "Bitte akzeptiere die AGB und lies die Widerrufsbelehrung.":
    "Please accept the terms and read the cancellation policy.",
  "Bitte schließe die Sicherheitsprüfung ab.":
    "Please complete the security check.",
  "Die verfügbaren Termine haben sich geändert. Bitte wähle erneut einen Termin aus.":
    "Available dates have changed. Please choose a date again.",
  "Dein Einkauf hat sich geändert. Prüfe die neuen Preise und bestätige Deine Bestellung erneut.":
    "Your shopping has changed. Check the new prices and confirm your order again.",
  "Bestellung {0}": "Order {0}",
  Danke: "Thank you",
  "Deine Bestellung ist eingegangen.": "We have received your order.",
  "Deine Bestellung wurde angelegt. Die Bestätigung kommt per E-Mail.":
    "Your order has been created. Confirmation will arrive by email.",
  "Wir konnten die Zahlung noch nicht bestätigen.":
    "We have not yet been able to confirm your payment.",
  "Wir prüfen Deine Bestellung.": "We are reviewing your order.",
  "Deine Bestellung ist bei uns.": "We have your order.",
  "Wir packen Deinen Einkauf und schicken Dir die Versandbestätigung mit Sendungsnummer per E-Mail.":
    "We are packing your order and will email your dispatch confirmation and tracking number.",
  "Wir schreiben Dir per E-Mail, sobald alles bereitliegt. ":
    "We will email you when everything is ready. ",
  "Wir liefern Deinen Einkauf": "We will deliver your shopping",
  " zum bestätigten Termin": " on the confirmed date",
  "und schicken Dir die Bestätigung per E-Mail.":
    "and email your confirmation.",
  "Deine Gutscheine senden wir Dir per E-Mail.": "We will email your vouchers.",
  "Alle E-Mails gehen an ": "All emails will be sent to ",
  "Dein Abholcode": "Your collection code",
  "Gilt ab unserer E-Mail „abholbereit“. Ausweis mitbringen.":
    "Valid once you receive our collection email. Please bring your ID.",
  "Status: ": "Status: ",
  " pro Stück": " per item",
  ", Mehrzweckgutschein, einlösbar für das komplette Sortiment":
    ", multi-purpose voucher, redeemable across the entire range",
  ", inkl. MwSt.": ", incl. VAT",
  "Bei geeigneter versiegelter Ware erlischt das Widerrufsrecht nach Entfernen der Versiegelung.":
    "Cancellation rights for applicable sealed goods end when the seal is removed.",
  "Schnell verderbliche Ware: kein Widerrufsrecht.":
    "Perishable goods: cancellation rights do not apply.",
  Rabatt: "Discount",
  Bezahlt: "Paid",
  "Inklusive MwSt. (Artikel):": "Including VAT (products):",
  Deutschland: "Germany",
  "Sendungsnummer: ": "Tracking number: ",
  "Die Zahlung war bestätigt. Für den aktuellen Stand öffne bitte den Bestelllink aus Deiner E-Mail.":
    "Payment was confirmed. Open the order link in your email for the latest status.",
  "Dein Warenkorb bleibt erhalten, bis die Zahlung bestätigt wurde.":
    "Your cart is saved until payment is confirmed.",
  "Den aktuellen Stand Deiner Bestellung findest Du hier.":
    "Check the current status of your order here.",
  "Weiter stöbern": "Keep browsing",
  "Mein Konto": "My account",
  "Die Zahlung wurde abgebrochen.": "Payment was cancelled.",
  "Erneut zur Zahlung": "Try payment again",
  "Dein Warenkorb und Deine Lieferdaten bleiben erhalten. Du kannst es noch einmal versuchen.":
    "Your cart and delivery details have been saved. You can try again.",
  "Fast ": "Almost ",
  "geschafft.": "there.",
  "Dein Warenkorb ist leer.": "Your cart is empty.",
  "Zum Shop": "Go to shop",
  "Such Dir etwas Schönes aus.": "Find something lovely.",
  "Die Bestellung konnte nicht abgeschlossen werden":
    "The order could not be completed",
  "Bitte prüfe Deine Angaben": "Please check your details",
  "Für diese Bestellung melde Dich bitte zuerst an.":
    "Please sign in before placing this order.",
  Anmelden: "Sign in",
  Lieferart: "Delivery method",
  Name: "Name",
  Kontakt: "Contact",
  Vorname: "First name",
  Nachname: "Last name",
  "Telefon (optional)": "Phone (optional)",
  "Abholung im Geschäft": "Collection from our shop",
  "Unser Geschäft": "Our shop",
  Lieferadresse: "Delivery address",
  "Adresse auswählen": "Choose an address",
  "Wir liefern nur innerhalb Deutschlands": "We only deliver within Germany",
  "Neue Adresse eingeben": "Enter a new address",
  "Straße und Hausnummer": "Street and house number",
  "Adresszusatz (optional)": "Address line 2 (optional)",
  Postleitzahl: "Postcode",
  Ort: "Town or city",
  "Lieferland: Deutschland": "Delivery country: Germany",
  "* Pflichtfeld. Wir verwenden Deine Daten für Deine Bestellung. ":
    "* Required field. We use your details to process your order. ",
  Datenschutz: "Privacy",
  "Du bekommst nach der Bestellung eine separate Bestätigungs-E-Mail an {0}. Bitte bestätige Deine Anmeldung über den Link darin. Abmeldung jederzeit im Konto oder über den Link in jeder Mail. ":
    "After ordering, you will receive a separate confirmation email at {0}. Please use its link to confirm your subscription. Unsubscribe at any time in your account or using the link in any email. ",
  "Du bekommst nach der Bestellung eine Bestätigungs-E-Mail (Double-Opt-in). Abmeldung jederzeit über den Link in jeder Mail. ":
    "After ordering, you will receive an email to confirm your subscription (double opt-in). Unsubscribe at any time using the link in any email. ",
  "Ich akzeptiere die": "I accept the",
  AGB: "terms and conditions",
  "und habe die": "and have read the",
  Widerrufsbelehrung: "cancellation policy",
  "zur Kenntnis genommen.": "before placing this order.",
  "Die Sicherheitsprüfung ist noch nicht eingerichtet. Bitte kontaktiere uns vor Deiner Bestellung.":
    "The security check is not configured yet. Please contact us before ordering.",
  "Bestellung wird aufgegeben …": "Placing your order …",
  "Zahlungspflichtig bestellen": "Place order and pay",
  "Du bezahlst im nächsten Schritt auf der sicheren Seite von Stripe. Zahlungsarten:":
    "In the next step you will pay on Stripe's secure page. Payment methods:",
  "Die Bestätigung geht an ": "Confirmation will be sent to ",
  "Dein ": "Your ",
  Warenkorb: "cart",
  "Noch nichts im Korb.": "Your cart is empty.",
  "Im Shop stöbern": "Browse the shop",
  Gutschein: "Voucher",
  "Zur Kasse": "Checkout",
  "Der Shop lädt gerade nicht.": "The shop could not be loaded.",
  "Erneut laden": "Reload",
  "Versuch es in ein paar Minuten noch einmal oder ruf uns an:":
    "Try again in a few minutes or call us:",
  ". Dein Warenkorb bleibt erhalten.": ". Your cart has been saved.",
  "Dieser Artikel ist gerade nicht online.":
    "This product is currently unavailable online.",
  "Zum Sortiment": "Browse the range",
  "Schau Dich im Sortiment um oder frag uns im Laden.":
    "Browse our range or ask us in the shop.",
  " Treffer im Sortiment.": " matches in our range.",
  "Dazu haben wir online nichts.": "No online matches found.",
  "Alle Artikel": "All products",
  "Vielleicht im Laden. Ruf uns an oder schau vorbei.":
    "We may have it in the shop. Call us or stop by.",
  "Shop · {0}": "Shop · {0}",
  "Aus unserem Laden. ": "From our shop. ",
  "Zu Dir.": "To you.",
  "Unser Sortiment": "Our range",
  "Click & Collect:": "Click & Collect:",
  " Wir schreiben Dir, sobald alles abholbereit ist.":
    " We will email you when everything is ready to collect.",
  " entdecken →": " explore →",
  "Versand in ganz Deutschland": "Delivery throughout Germany",
  Sortiment: "Range",
  " online": " online",
  "Bei Veranstaltungen": "At events",
  "Aus unseren ": "From our ",
  Veranstaltungen: "events",
  Veranstaltungstermine: "Event dates",
  "Gerade ": "Currently ",
  empfohlen: "recommended",
  Shop: "Shop",
  "Im Shop suchen": "Search the shop",
  "Der Online-Shop macht gerade Pause.": "The online shop is taking a break.",
  " Stöbern geht weiterhin. Im Laden sind wir wie gewohnt für Dich da.":
    " You can still browse. Our shop is open as usual.",
  "Dein Warenkorb": "Your cart",
  "Warenkorb schließen": "Close cart",
  "Zum Warenkorb": "View cart",
  Gutscheincode: "Voucher code",
  Einlösen: "Redeem",
  "{0} eingelöst": "{0} redeemed",
  "Wird geprüft": "Checking",
  "Gutschein {0} entfernen": "Remove voucher {0}",
  Entfernen: "Remove",
  Land: "Country",
  Region: "Region",
  Rebsorte: "Grape variety",
  Preis: "Price",
  "über 60 €": "over €60",
  Flaschengröße: "Bottle size",
  "Halbe Flasche": "Half bottle",
  "Magnum und größer": "Magnum and larger",
  Bio: "Organic",
  "Bio-zertifiziert": "Certified organic",
  "Aus unseren Veranstaltungen": "From our events",
  Verfügbarkeit: "Availability",
  "Sofort verfügbar": "Available now",
  Filter: "Filter",
  "Filter schließen": "Close filters",
  Zurücksetzen: "Reset",
  " Artikel anzeigen": " products",
  "Wir packen jeden Korb für Dich von Hand.":
    "We pack every basket by hand for you.",
  "Alle Filter zurücksetzen": "Reset all filters",
  Alle: "All",
  Weißwein: "White wine",
  Rotwein: "Red wine",
  Rosé: "Rosé",
  Schaumwein: "Sparkling wine",
  Sortieren: "Sort",
  Empfehlung: "Recommended",
  "Preis aufsteigend": "Price: low to high",
  "Preis absteigend": "Price: high to low",
  "Name A bis Z": "Name: A to Z",
  "Filter {0} entfernen": "Remove filter {0}",
  Verfügbar: "Available",
  "Keine Artikel für diese Auswahl.": "No products match this selection.",
  "Hier ist gerade nichts online.":
    "There is nothing online here at the moment.",
  "Schau später wieder vorbei oder setze Deine Filter zurück.":
    "Check back later or reset your filters.",
  " von ": " of ",
  " Artikeln": " products",
  "Angezeigte Artikel": "Products shown",
  "Weitere ": "Show ",
  anzeigen: "more",
  Versandkosten: "Delivery costs",
  "Deine Auswahl": "Your selection",
  "Dein Wunschwert in Euro (ab {0})": "Your amount in euros (from {0})",
  "Bitte wähle einen Wert ab {0}.": "Please choose an amount of at least {0}.",
  "Deine Wünsche / Grußkarte (optional)":
    "Your requests / gift message (optional)",
  "/200 Zeichen": "/200 characters",
  Menge: "Quantity",
  Weniger: "Less",
  Mehr: "More",
  Ausverkauft: "Sold out",
  "In den Warenkorb": "Add to cart",
  "Kein Versand. Frische Ware ist nur zur Abholung erhältlich.":
    "No delivery. Fresh goods are available for collection only.",
  "Dein Gutschein kommt per E-Mail.": "Your voucher arrives by email.",
  "Versand mit DHL: {0}, innerhalb Deutschlands.":
    "DHL delivery: {0}, within Germany.",
  "Versandkosten werden vor der Bestellung angezeigt.":
    "Delivery costs are shown before you order.",
  "Click & Collect: {0}, {1}.": "Click & Collect: {0}, {1}.",
  "Nach Entfernen der Versiegelung erlischt das Widerrufsrecht bei versiegelter Ware, die aus Gründen des Gesundheitsschutzes oder der Hygiene nicht zur Rückgabe geeignet ist.":
    "Cancellation rights end when the seal is removed from goods that cannot be returned for health or hygiene reasons.",
  "Frag uns im Laden:": "Ask us in the shop:",
  Beschreibung: "Description",
  Steckbrief: "Details",
  "Nährwerte je 100 g / ml": "Nutrition per 100 g / ml",
  "So kommt Dein Einkauf ": "How your shopping gets ",
  "zu Dir": "to you",
  "Ware wird für den Versand vorbereitet": "Goods are prepared for delivery",
  "Nach Hause, innerhalb Deutschlands": "To your home, within Germany",
  Geschäft: "Shop",
  Abholung: "Collection",
  "Wir schreiben Dir, sobald alles bereitliegt":
    "We will email you when everything is ready",
  "Gut zu wissen": "Good to know",
  Bezahlen: "Payment",
  "Du wirst nach Deiner Bestellung zur sicheren Zahlungsseite von Stripe weitergeleitet. Zahlungsarten:":
    "After ordering, you will be redirected to Stripe's secure payment page. Payment methods:",
  ". Gutscheine löst Du bereits an der Kasse ein. ":
    ". Redeem vouchers at checkout. ",
  "Bitte gib Deinen Vornamen ein.": "Please enter your first name.",
  "Bitte gib Deinen Nachnamen ein.": "Please enter your last name.",
  "Bitte gib eine gültige E-Mail-Adresse ein.":
    "Please enter a valid email address.",
  "Bitte gib Straße und Hausnummer ein.":
    "Please enter your street and house number.",
  "Alkohol versenden wir nicht an Packstationen, Postfilialen oder Postfächer.":
    "We do not deliver alcohol to parcel lockers, post offices or PO boxes.",
  "Bitte gib eine fünfstellige deutsche Postleitzahl ein.":
    "Please enter a five-digit German postcode.",
  "Bitte gib Deinen Ort ein.": "Please enter your town or city.",
  "Bitte wähle Versand oder Abholung.": "Please choose delivery or collection.",
  "Bitte wähle einen Abhol- oder Liefertermin aus.":
    "Please choose a collection or delivery date.",
  Erzeuger: "Producer",
  Art: "Type",
  Herkunft: "Origin",
  Rebsorten: "Grape varieties",
  Jahrgang: "Vintage",
  Alkohol: "Alcohol",
  Inhalt: "Contents",
  Zutaten: "Ingredients",
  Allergene: "Allergens",
  "Kann Spuren enthalten": "May contain traces of",
  "Bio-Kontrollstelle": "Organic control body",
  Lebensmittelunternehmen: "Food business",
  Abfüller: "Bottler",
  "Anmeldung gerade nicht möglich. Bitte später erneut versuchen.":
    "Sign-up is currently unavailable. Please try again later.",
  "Bitte warte fünf Minuten nach der letzten E-Mail, bevor Du einen neuen Bestätigungslink anforderst.":
    "Please wait five minutes after the last email before requesting another confirmation link.",
  "Bitte warte kurz, bis die Sicherheitsprüfung geladen ist.":
    "Please wait for the security check to load.",
  "Verbindung fehlgeschlagen. Bitte später erneut versuchen.":
    "Connection failed. Please try again later.",
  "◆ Erste Reihe": "◆ Front row",
  "Neuigkeiten zuerst erfahren": "Be the first to hear",
  "Veranstaltungen und": "Events and",
  "Empfehlungen.": "recommendations.",
  "Selten, aber gut. Kein Spam, nur, wenn wirklich was anliegt.":
    "Occasional good things. No spam, just news worth sharing.",
  "Fast geschafft": "Almost there",
  "✓ Fast geschafft": "✓ Almost there",
  "Fast geschafft: Bitte bestätige Deine Anmeldung über den Link in unserer E-Mail.":
    "Almost there: please confirm your subscription using the link in our email.",
  "Wenn eine Bestätigung erforderlich ist, erhältst Du eine E-Mail. Bitte bestätige Deine Anmeldung über den Link darin und prüfe auch Deinen Spam-Ordner.":
    "If confirmation is required, you will receive an email. Please use its link to confirm your subscription and check your spam folder too.",
  "Vorname (optional)": "First name (optional)",
  "Sende…": "Sending…",
  "Newsletter abonnieren": "Subscribe to the newsletter",
  "Mit Klick auf „Newsletter abonnieren“ forderst Du eine Bestätigungs-E-Mail an ":
    "By clicking “Subscribe to the newsletter”, you request a confirmation email from ",
  " an. Erst nach Deiner Bestätigung erhältst Du den Newsletter. Abmeldung jederzeit im Konto oder über den Link in jeder Mail.":
    ". You will receive the newsletter after confirming. Unsubscribe at any time in your account or using the link in any email.",
  'Mit Klick auf „Abonnieren" willigst du in den Versand ein. Bestätigung per E-Mail (Double-Opt-in). Abmeldung jederzeit über den Link in jeder Mail. Spam-Schutz durch':
    "By clicking “Subscribe”, you consent to receive the newsletter. Confirm by email (double opt-in). Unsubscribe at any time using the link in any email. Spam protection by",
  "Cloudflare Turnstile": "Cloudflare Turnstile",
  " (cookie-frei). Mehr in der": " (cookie-free). Read our",
  Datenschutzerklärung: "privacy policy",
  "Bitte gib ein gültiges Datum ein.": "Please enter a valid date.",
  "Am {0} haben wir geschlossen.{1}": "We are closed on {0}.{1}",
  "Reservierungen ab {0} Uhr bis vor {1} Uhr.":
    "Reservations from {0} until before {1}.",
  "Bitte wähle eine Uhrzeit ab {0} Uhr bis vor {1} Uhr.":
    "Please choose a time from {0} until before {1}.",
  "Online-Reservierungen sind gerade nicht verfügbar.":
    "Online reservations are currently unavailable.",
  "Die Sicherheitsprüfung ist gerade nicht verfügbar.":
    "The security check is currently unavailable.",
  "Online-Reservierungen sind gerade nicht verfügbar. Bitte rufe uns an.":
    "Online reservations are currently unavailable. Please call us.",
  "Bitte bestätige kurz die Sicherheitsprüfung (Spamschutz) und klicke erneut auf Absenden.":
    "Please complete the security check and submit again.",
  "Verbindung fehlgeschlagen. Bitte versuche es erneut oder rufe uns an.":
    "Connection failed. Please try again or call us.",
  "Für Gruppen ab {0} Personen": "For groups of {0} or more",
  "Es wurde kein Tisch reserviert und keine Anfrage versendet. Bitte ":
    "No table has been reserved and no request has been sent. Please ",
  "sende uns eine Gruppenanfrage": "send us a group enquiry",
  " oder rufe uns unter ": " or call us on ",
  " an.": ".",
  "✓ Tisch reserviert": "✓ Table reserved",
  "✓ Anfrage gesendet": "✓ Request sent",
  "Vielen Dank!": "Thank you!",
  "Dein Tisch ist verbindlich reserviert. Schau gleich in Deinem Posteingang nach: Dort wartet Deine Bestätigung, mit der Du die Reservierung bei Bedarf auch wieder stornieren kannst.":
    "Your table is confirmed. Check your inbox for your confirmation, which also lets you cancel if needed.",
  "Wir haben Deine Reservierungsanfrage erhalten und melden uns zeitnah mit einer Bestätigung. Schau gleich auch in Deinem Posteingang nach.":
    "We have received your reservation request and will confirm shortly. Please check your inbox too.",
  "Wenn es dringend ist, ruf uns auch gerne direkt an:":
    "If it is urgent, please call us directly:",
  "Tisch anfragen": "Request a table",
  "Wir freuen uns auf Euch.": "We look forward to welcoming you.",
  "Name *": "Name *",
  "E-Mail *": "Email *",
  Telefon: "Phone",
  "Datum *": "Date *",
  "TT.MM.JJJJ": "DD.MM.YYYY",
  "Uhrzeit *": "Time *",
  "Für Gruppen ab 9 Personen sende uns bitte eine ":
    "For groups of 9 or more, please send us an ",
  Anfrage: "enquiry",
  ". Du erhältst ein individuelles Angebot.":
    ". We will send you a tailored offer.",
  "Personen * ({0} bis {1})": "Guests * ({0} to {1})",
  " Personen": " guests",
  "{0} oder mehr Personen (Anfrage)": "{0} or more guests (enquiry)",
  "Nachricht (optional)": "Message (optional)",
  "Wünsche, besondere Hinweise": "Requests or special requirements",
  ", gelegentliche Hinweise auf Veranstaltungen und Empfehlungen. Du erhältst zur Bestätigung eine separate E-Mail (Double-Opt-in). Abmeldung jederzeit über den Link in jeder E-Mail. ":
    " for occasional events and recommendations. You will receive a separate confirmation email (double opt-in). Unsubscribe at any time using the link in any email. ",
  "Jetzt reservieren": "Reserve now",
  "Es gelten unsere ": "Our terms apply: ",
  "Deine Angaben nutzen wir nur für Deine Reservierung. Mehr dazu in der":
    "We only use your details for your reservation. Read our",
  ". Dieses Formular ist durch": ". This form uses",
  " gegen Spam geschützt (cookie-frei).": " for cookie-free spam protection.",
  "Bitte gib das Datum als TT.MM.JJJJ ein.":
    "Please enter the date as DD.MM.YYYY.",
  "Die Sicherheitsprüfung ist fehlgeschlagen oder die Online-Buchung ist nicht verfügbar. Bitte versuche es erneut oder rufe uns an.":
    "The security check failed or online booking is unavailable. Please try again or call us.",
  "Zu dieser Zeit sind nicht genügend Plätze verfügbar. Bitte wähle einen anderen Termin oder rufe uns an.":
    "There are not enough places at this time. Please choose another date or call us.",
  "Bitte prüfe Deine Angaben und die zulässige Personenzahl.":
    "Please check your details and the permitted group size.",
  "Zu viele Versuche. Bitte warte kurz und versuche es erneut.":
    "Too many attempts. Please wait a moment and try again.",
  "Die Anfrage ist gerade nicht möglich. Bitte versuche es später erneut oder rufe uns an.":
    "Requests are currently unavailable. Please try again later or call us.",
};

export const englishBookingLabels: BookingLabels = {
  eventsLoading: "Loading experiences…",
  eventUnavailable: "This experience is unavailable.",
  guestDisabled:
    "Guest booking is currently unavailable. Please contact us to book this experience.",
  eventVoucherRequired:
    "Please enter a valid experience voucher for every place.",
  eventVoucherMissing: (count) =>
    `${count} ${count === 1 ? "place still needs" : "places still need"} an experience voucher.`,
  eventVoucherDescription:
    "Experience voucher for one person, covering one place",
  eventVoucherNotice:
    "Each place needs an experience voucher. Sign in with your account to book. Older codes are checked when you book.",
  eventDetails: "More about this experience",
};

export const englishAccountLabels: AccountLabels = {
  event: "Experience",
  events: "Experiences",
  eventVoucher: "Experience vouchers",
  eventVoucherSingular: "Experience voucher",
  product: "Product",
  products: "Products",
  pickup: "Collection",
  voucherUse: "Redeem a voucher",
  newsletter: "News from the atelier",
  ageHint: "Please check the minimum age for this offer.",
  birthDateHint: "Enter your date of birth as DD.MM.YYYY.",
};

export const englishBookingFormat: BookingFormat = {
  locale: "en-GB",
  currency: "EUR",
};

export const formatEnglishPrice = (cents: number) =>
  new Intl.NumberFormat("en-GB", { style: "currency", currency: "EUR" }).format(
    cents / 100,
  );

// The product adapter is public; keep its English presentation with the catalogue.
export function englishProductPresentation(article: ShopArticle) {
  const model = defaultShopProduct(article, englishMessages);
  const kind = article.voucher_kind ?? article.kind;
  const unitPrice = (price: typeof article.unit_price) =>
    price ? `${formatEnglishPrice(price.amount_cents)} / ${price.unit}` : "";
  return {
    ...model,
    subtitle:
      article.type === "VOUCHER"
        ? kind === "MULTI_PURPOSE"
          ? "Multi-purpose voucher, redeemable across the entire range"
          : kind === "SINGLE_PURPOSE"
            ? `Single-purpose voucher${article.redeemable_for_text ? `, ${article.redeemable_for_text}` : ""}`
            : article.redeemable_for_text || "Voucher"
        : model.subtitle,
    unitPrice: [article.quantity_information, unitPrice(article.unit_price)]
      .filter(Boolean)
      .join(" · "),
    variants: model.variants?.map((variant, index) => ({
      ...variant,
      unitPrice: [
        article.variants[index].quantity_information,
        unitPrice(article.variants[index].unit_price),
      ]
        .filter(Boolean)
        .join(" · "),
    })),
  };
}

export const englishShopCopy = {
  newsletterOptInLabel: "Subscribe to the newsletter",
  giftDeliveryNote: "Your voucher arrives by email.",
  paymentMethods: ["Credit card", "Debit card"],
};

export const englishAccountNotice = "Please sign in to access your account.";
