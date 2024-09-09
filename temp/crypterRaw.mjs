export class TestRSA extends Operation { // udesk
  constructor () { super('TestRSA') }

  async run (id, data) { 
    try {
      const session = stores.session
      const args = { token: session.authToken, id, data }
      const ret = this.tr(await post(this, 'TestRSA', args))
      return this.finOK(ret.data)
    } catch (e) {
      await this.finKO(e)
    }
  }
}

/*
OP_CrypterRaw: 'Test d\'encryptage serveur d\'un buffer long',
Le serveur créé un binaire dont,
- les 256 premiers bytes crypte en RSA, la clé AES, IV et l'indicateur gz
- les suivants sont le texte du buffer long crypté par la clé AES générée.
args.token
args.id
args.data
args.gz
Retour:
- data: "fichier" binaire auto-décryptable en ayant la clé privée RSA
OU la clé du site
*/

export class CrypterRaw extends Operation {
  constructor () { super('CrypterRaw') }

  async run (id, data, gz, clesite) { 
    try {
      const session = stores.session
      const aSt = stores.avatar
      const args = { token: session.authToken, id, data, gz }
      const ret = this.tr(await post(this, 'CrypterRaw', args))
      const priv = clesite ? null : aSt.getAvatar(id).priv
      const res = await decrypterRaw(priv, clesite, ret.data, gz)
      return this.finOK(res)
    } catch (e) {
      await this.finKO(e)
    }
  }
}