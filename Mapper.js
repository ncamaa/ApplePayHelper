/**
 * Mapper Class
 * Handles the logic to map the decrypted Apple Pay token to the desired format.
 */
class Mapper {
  /**
   * Constructs an instance of Mapper.
   * @param { import('./applePayHelperTypes').ApplePayConfig } config - Configuration object containing necessary parameters.
   */
  constructor(config) {
    this.config = config;
  }

  /**
   * Maps the decrypted token using the specified provider's format.
   * @param {import('./applePayHelperTypes').DecryptedTokenRaw} decryptedToken - The decrypted Apple Pay token.
   * @param {string} provider - The provider's name (e.g., "PayCom").
   * @returns {import('./applePayHelperTypes').DecryptedTokenRaw | import('./applePayHelperTypes').PayCOMDecryptedToken} - The mapped token.
   */
  map(decryptedToken, provider) {
    switch (provider) {
      case "PayCom":
        return this.mapToPayCom(decryptedToken);
      // Add cases for other providers as needed
      default:
        console.log(
          `Unsupported provider: ${provider}, returning original token.`
        );
        return decryptedToken;
    }
  }

  /**
   * Maps the decrypted token to the PayCom (pay.com) format.
   * @param {import('./applePayHelperTypes').DecryptedTokenRaw} decryptedToken - The decrypted Apple Pay token.
   * @returns {import('./applePayHelperTypes').PayCOMDecryptedToken} - The mapped token.
   */
  mapToPayCom(decryptedToken) {
    const applicationExpirationDate = decryptedToken.applicationExpirationDate;
    const currencyCode = decryptedToken.currencyCode;
    const transactionAmount = decryptedToken.transactionAmount;
    const onlinePaymentCryptogram =
      decryptedToken.paymentData.onlinePaymentCryptogram;

    return {
      source_data: {
        type: "network_token",
        network_token: {
          token: decryptedToken.applicationPrimaryAccountNumber,
          token_type: "applepay",
          expiry_month: applicationExpirationDate.substring(2, 4),
          expiry_year: `20${applicationExpirationDate.substring(0, 2)}`,
          three_ds: {
            eci: "06", // Assuming ECI is a constant value in this case
            cryptogram: onlinePaymentCryptogram,
          },
        },
      },
      amount: transactionAmount,
      currency: this.getCurrencyCode(currencyCode),
    };
  }

  /**
   * Returns the three-letter currency code in lowercase for a given numerical currency code.
   * @param {number} numCode - The numerical currency code (e.g., 840).
   * @returns {string} - The three-letter currency code in lowercase (e.g., "usd"), or "unknown" if the numerical code is not recognized.
   */
  getCurrencyCode(numCode) {
    const currencyMap = {
      100: "bgl",
      104: "buk",
      108: "bif",
      112: "byb",
      116: "khr",
      124: "cad",
      132: "cve",
      136: "kyd",
      144: "lkr",
      152: "clp",
      156: "cny",
      170: "cop",
      174: "kmf",
      180: "zrz",
      188: "crc",
      191: "hrk",
      192: "cup",
      196: "cyp",
      200: "csk",
      203: "csj",
      208: "dkk",
      214: "dop",
      218: "ecs",
      222: "svc",
      226: "gqe",
      230: "etb",
      232: "ern",
      233: "eek",
      238: "fkp",
      242: "fjd",
      246: "fim",
      250: "frf",
      262: "djf",
      268: "gek",
      270: "gmd",
      278: "ddm",
      288: "ghc",
      292: "gip",
      300: "grd",
      320: "gtq",
      324: "gns",
      328: "gyd",
      332: "htg",
      340: "hnl",
      344: "hkd",
      348: "huf",
      352: "isj",
      356: "inr",
      360: "idr",
      364: "irr",
      368: "iqd",
      372: "iep",
      376: "ilr",
      380: "itl",
      388: "jmd",
      392: "jpy",
      398: "kzt",
      400: "jod",
      404: "kes",
      408: "kpw",
      410: "krw",
      414: "kwd",
      417: "kgs",
      418: "laj",
      422: "lbp",
      426: "lsm",
      428: "lvr",
      430: "lrd",
      434: "lyd",
      440: "ltt",
      442: "luf",
      446: "mop",
      450: "mgf",
      454: "mwk",
      458: "myr",
      462: "mvq",
      466: "mlf",
      470: "mtp",
      478: "mro",
      480: "mur",
      484: "mxp",
      496: "mnt",
      498: "mdl",
      504: "mad",
      508: "mzm",
      512: "omr",
      516: "nad",
      524: "npr",
      528: "nlg",
      532: "ang",
      533: "awg",
      548: "vuv",
      554: "nzd",
      558: "nic",
      566: "ngn",
      578: "nok",
      586: "pkr",
      590: "pab",
      598: "pgk",
      600: "pyg",
      604: "pes",
      608: "php",
      616: "plz",
      620: "pte",
      624: "gwp",
      626: "tpe",
      634: "qar",
      642: "rol",
      643: "rub",
      646: "rwf",
      654: "shp",
      678: "std",
      682: "sar",
      690: "scr",
      694: "sll",
      702: "sgd",
      703: "skk",
      704: "vnc",
      705: "sit",
      706: "sos",
      710: "zar",
      716: "zwd",
      720: "ydd",
      724: "esp",
      728: "ssp",
      736: "sdp",
      740: "srg",
      748: "szl",
      752: "sek",
      756: "chf",
      760: "syp",
      762: "tjr",
      764: "thb",
      776: "top",
      780: "ttd",
      784: "aed",
      788: "tnd",
      792: "trl",
      795: "tmm",
      800: "ugw",
      804: "uak",
      807: "mkd",
      810: "sur",
      818: "egp",
      826: "gbp",
      834: "tzs",
      840: "usd",
      858: "uyp",
      860: "uzs",
      862: "veb",
      882: "wst",
      886: "yer",
      890: "yun",
      891: "yum",
      894: "zmk",
      901: "twd",
      925: "sle",
      926: "ved",
      927: "uyw",
      928: "ves",
      929: "mru",
      930: "stn",
      931: "cuc",
      932: "zwl",
      933: "byn",
      934: "tmt",
      935: "zwr",
      936: "ghs",
      937: "vef",
      938: "sdg",
      939: "ghp",
      940: "uyi",
      941: "rsd",
      942: "zwn",
      943: "mzn",
      944: "azn",
      945: "aym[h]",
      946: "ron",
      947: "che",
      948: "chc",
      949: "try",
      950: "xaf",
      951: "xcd",
      952: "xof",
      953: "xpf",
      954: "xeu",
      955: "xba",
      956: "xbb",
      957: "xbc",
      958: "xbd",
      959: "xau",
      960: "xdr",
      961: "xag",
      962: "xpt",
      963: "xts",
      964: "xpd",
      965: "xua",
      967: "zmw",
      968: "srd",
      969: "mga",
      970: "cou",
      971: "afn",
      972: "tjs",
      973: "aoa",
      974: "byr",
      975: "bgn",
      976: "cdf",
      977: "bam",
      978: "eur",
      979: "mxv",
      980: "uah",
      981: "gel",
      982: "aor",
      983: "ecv",
      984: "bov",
      985: "pln",
      986: "brl",
      987: "brr",
      988: "lul",
      989: "luc",
      990: "clf",
      991: "zal",
      992: "bel",
      993: "bec",
      994: "xsu",
      995: "esb",
      996: "esa",
      997: "usn",
      998: "uss",
      999: "xxx",
      "008": "alk",
      "051": "amd",
      "032": "ary",
      "036": "aud",
      "052": "bbd",
      "050": "bdt",
      "048": "bhd",
      "060": "bmd",
      "096": "bnd",
      "068": "bop",
      "044": "bsd",
      "064": "btn",
      "072": "bwp",
      "084": "bzd",
      "012": "dzd",
      "090": "sbd",
      "020": "adp",
      "004": "afa",
      "024": "aon",
      "040": "ats",
      "031": "azm",
      "070": "bad",
      "056": "bef",
      "076": "brn",
      "276[i]": "dem",
      "...": "xre",
      BBD: "bds[44][j]",
      "—": "yur",
      ILS: "nis[50]",
      TWD: "ntd[51]",
      GBP: "stg[54]",
      CNY: "rmb",
      ARY: "arl",
    };

    const currencyCode = currencyMap[numCode];
    return currencyCode ? currencyCode : "unknown";
  }
}

module.exports = Mapper;
