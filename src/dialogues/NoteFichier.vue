<template>
<div :class="dkli + ' bs dp50'">
<q-layout container view="hHh lpR fFf">
  <q-header elevated class="bg-secondary text-white">
    <q-toolbar>
      <q-btn dense size="md" color="warning" icon="close" @click="fermer"/>
      <q-toolbar-title v-if="avatar" 
        class="titre-lg full-width text-center">{{$t('PNOfictit1', [avatar.na.nom])}}</q-toolbar-title>
      <q-toolbar-title v-if="groupe" 
        class="titre-lg full-width text-center">{{$t('PNOfictit2', [groupe.na.nomc])}}</q-toolbar-title>
      <bouton-help page="page1"/>
    </q-toolbar>
    <q-toolbar v-if="ro!==0 || exv!==0" inset
      class="full-width bg-yellow-5 text-black titre-md text-bold">
      <div class="row justify-center">
        <q-icon name="warning" color="warning" size="md" class="q-mr-sm"/>
        <span>{{$t('PNOro' + ro)}}</span>
        <span>{{$t('PNOexv2' + exv)}}</span>
      </div>
    </q-toolbar>
  </q-header>

  <q-page-container>
    <q-page class="q-pa-xs column items-center">
      <q-btn flat dense color="primary" class="q-mt-sm" size="md" icon="add"
        :label="$t('PNFnvaj')" @click="nouveau()"/>
      <div v-for="it in state.listefic" :key="it.nom" class="full-width">
        <div class="row">
          <q-expansion-item v-model="exp[it.nom]" group="nom" class="col" switch-toggle-side
            header-class="expansion-header-class-1 titre-md bg-secondary text-white">
            <template v-slot:header>
              <q-item-section>
                <div class="row justify-between items-center">
                  <div class="col titre-lg text-bold">{{it.nom}}</div>
                  <div class="col-auto row items-center">
                    <div class="col fs-md q-mr-md">
                      {{$t('PNFnbv', it.l.length, { count: it.l.length})}}
                    </div>
                    <q-btn dense color="primary" class="q-mt-sm" size="sm" icon="add"
                      @click="nouveau(it.nom)"/>
                  </div>
                </div>
              </q-item-section>
            </template>
            <q-card-section class="ma-qcard-section column">
              <div v-if="it.avn" class="titre-md row items-center">
                <div class="titre-md q-mr-sm">{{$t('PNFl1')}}</div>
                <q-btn v-if="session.synchro || session.avion"
                  icon="clear" size="md" dense color="negative"
                  @click="itc=it;ovconfirmav1()"/>
              </div>
              <div v-if="!it.avn && (session.synchro || session.avion && it.avn)"
                class="text-primary titre-md cursor-pointer text-bold"
                @click="avnom(it)">{{$t('PNFl2')}}</div>
              <div v-for="(f, idy) in it.l" :key="f.idf" class="q-my-sm">
                <q-separator class="q-mb-sm"/>
                <div class="row justify-between items-center">
                  <div class="col">
                    <span class="text-bold q-pr-lg">{{f.info}}</span>
                    <span class="fs-md">{{edvol(f.lg)}} - {{f.type}} - </span>
                    <span class="font-mono fs-sm">#{{f.idf}}</span>
                  </div>
                  <div class="col-auto font-mono fs-sm">{{dhcool(f.dh)}}</div>
                </div>
                <div class="column">
                  <div v-if="it.avn && idy === 0" class="titre-md text-italic">{{$t('PNFl4')}}</div>
                  <div v-if="!f.av && (session.synchro || session.avion)"
                    class="text-primary titre-md cursor-pointer text-bold"
                    @click="avidf(f)">{{$t('PNFl5')}}</div>
                  <div v-if="f.av" class="titre-md row items-center">
                    <div class="titre-md q-mr-sm">{{$t('PNFl6')}}</div>
                    <q-btn v-if="session.synchro || session.avion"
                      icon="clear" size="md" dense color="negative"
                      @click="fc=f;ovconfirmav2()"/>
                  </div>
                  <div class="col-auto row justify-end q-gutter-xs h13">
                    <q-btn size="sm" dense color="primary" icon="content_copy" :label="$t('PNFcop')" @click="copierFic(f)"/>
                    <q-btn size="sm" dense color="primary" icon="open_in_new" :label="$t('PNFaff')" @click="affFic(f)"/>
                    <q-btn size="sm" dense color="primary" icon="save" :label="$t('PNFenreg')" @click="enregFic(f)"/>
                    <q-btn size="sm" dense color="warning" icon="delete" :label="$t('PNFsuppr')" @click="supprFic(f)"/>
                  </div>
                </div>
              </div>
            </q-card-section>
          </q-expansion-item>
        </div>
      </div>
      </q-page>
  </q-page-container>

  <q-dialog v-model="nouveaufichier" persistent>
    <nouveau-fichier :nomfic="nomfic"/>
  </q-dialog>

  <q-dialog v-model="supprfichier" persistent>
    <q-card class="bs petitelargeur q-pa-sm">
      <q-card-section class="column items-center q-my-md">
        <div class="titre-md text-center text-italic">{{$t('PNFsf')}}</div>
        <div class="q-mt-sm fs-md font-mono text-bold">{{f.nom}} - {{f.info}}</div>
      </q-card-section>
      <q-card-actions vertical align="center">
        <q-btn flat :label="$t('renoncer')" color="primary" @click="MD.fD" />
        <q-btn flat :label="$t('confirmer')" color="warning" @click="cfSuppr" />
      </q-card-actions>
    </q-card>
  </q-dialog>

  <q-dialog v-model="confirmav1" persistent>
    <q-card class="bs petitelargeur q-pa-sm">
      <q-card-section class="column items-center q-my-md">
        <div class="titre-md text-center text-italic">{{$t('PNFav1')}}</div>
        <div class="q-mt-sm fs-md font-mono text-bold">{{itc.nom}}</div>
      </q-card-section>
      <q-card-actions vertical align="center">
        <q-btn flat :label="$t('renoncer')" color="primary" @click="MD.fD" />
        <q-btn flat :label="$t('confirmer')" color="warning" @click="cfAvnom" />
      </q-card-actions>
    </q-card>
  </q-dialog>

  <q-dialog v-model="confirmav2" persistent>
    <q-card class="bs petitelargeur q-pa-sm">
      <q-card-section class="column items-center q-my-md">
        <div class="titre-md text-center text-italic">{{$t('PNFav2')}}</div>
        <div class="q-mt-sm fs-md font-mono text-bold">{{fc.nom}} - {{fc.info}}</div>
      </q-card-section>
      <q-card-actions vertical align="center">
        <q-btn flat :label="$t('renoncer')" color="primary" @click="MD.fD" />
        <q-btn flat :label="$t('confirmer')" color="warning" @click="cfAvidf" />
      </q-card-actions>
    </q-card>
  </q-dialog>

</q-layout>
</div>
</template>

<script>
import { ref, toRef, reactive } from 'vue'
import stores from '../stores/stores.mjs'
import { MD } from '../app/modele.mjs'
import { edvol, dhcool, afficherDiag } from '../app/util.mjs'
import BoutonHelp from '../components/BoutonHelp.vue'
import NouveauFichier from '../dialogues/NouveauFichier.vue'
import { UNITEV2 } from '../app/api.mjs'
import { saveAs } from 'file-saver'
import { SupprFichier } from '../app/operations.mjs'
import { gestionFichierMaj } from '../app/db.mjs'
import { FLset } from '../app/db.mjs'

export default {
  name: 'NoteFichier',

  components: { 
    BoutonHelp, NouveauFichier
  },

  props: { ro: Number },

  computed: {
    lidk () { return !this.$q.dark.isActive ? 'sombre0' : 'clair0' },
    dkli () { return this.$q.dark.isActive ? 'sombre' : 'clair' },
    modifie () { return false }
  },

  watch: {
  },

  methods: {
    fermer () { if (this.modifie) MD.oD('cf'); else MD.fD() },

    async nouveau (nf) {
      if (!await this.session.edit()) return
      const er = this.erEdit()
      if (er) { 
        await afficherDiag(this.$t('PNOer' + er ))
      } else {
        this.nomfic = nf
        this.ovnouveaufichier()
        setTimeout(() => {
          if (nf) this.exp[nf] = true
        }, 100)
      }
    },

    erEdit () {
      if (this.nSt.node.type === 3) return 1
      const g = this.nSt.node.type === 5 ? this.nSt.egr.groupe : null
      if (!g) return 0
      // note de groupe
      if (g.pe === 1) return 4
      // le membre ayant l'exclusivité est-il avatar du compte ?
      if (this.nSt.note.im && !this.gSt.excluEstAvc(g.id)) return 8 
      // un des avatars du compte est auteur / animateur
      if (!this.gSt.avcAA(g.id)) return 7
      return 0
    },

    async supprFic (f) {
      if (!await this.session.edit()) return
      const er = this.erEdit()
      if (er) { 
        await afficherDiag(this.$t('PNOer' + er ))
      } else {
        this.f = f
        this.ovsupprfichier()
      }
    },

    async cfSuppr() {
      await new SupprFichier().run(this.nSt.note, this.f.idf)
      MD.fD()
    },

    avidf (f) {
      setTimeout(async () => {
        await gestionFichierMaj(this.nSt.note, true, f.idf, '')
      }, 50)
    },

    async cfAvidf () {
      MD.fD()
      await gestionFichierMaj(this.nSt.note, false, this.fc.idf, '')
    },

    avnom (it) {
      setTimeout(async () => {
        await gestionFichierMaj(this.nSt.note, true, 0, it.nom)
      }, 50)
    },

    async cfAvnom () {
      MD.fD()
      await gestionFichierMaj(this.nSt.note, false, 0, this.itc.nom)
    },

    async blobde (f, b) {
      const buf = await this.nSt.note.getFichier(f.idf)
      if (!buf || !buf.length) return null
      const blob = new Blob([buf], { type: f.type })
      return b ? blob : URL.createObjectURL(blob)
    },

    async stf1 (f) { // visibilité d'un fichier
      const fSt = stores.fetat
      const fetat = fSt.getFetat(f.idf)
      if (fetat && fetat.estCharge) return true
      const session = stores.session
      if (this.session.avion) {
        const avn = this.state.avn
        const b = avn && ((avn.lidf.indexOf(f.idf) !== -1) || (avn.mnom[f.nom] === f.idf))
        if (b) return true
        await afficherDiag($t('PNFfav'))
        return false
      }
      if (session.estBloque) {
        await afficherDiag($t('PNFfbl'))
        return false
      }
      return true
    },

    async copierFic (f) {
      if (!await this.stf1(f)) return
      const u8 = await this.nSt.note.getFichier(f.idf)
      if (!u8) {
        await afficherDiag(this.$t('PNFgetEr'))
        return
      }
      await FLset(f.nom, f.info, f.type, u8)
      this.ui.afficherMessage(this.$t('PNFcpp'))
      this.ppSt.modecc = false
      this.ppSt.setTabFichiers()
      MD.oD('pressepapier')
    },

    async affFic (f) {
      if (!await this.stf1(f)) return
      const url = await this.blobde(f)
      if (url) {
        setTimeout(() => { window.open(url, '_blank') }, 100)
        console.log(url)
      } else {
        await afficherDiag(this.$t('PNFgetEr'))
      }
    },

    async enregFic (f) {
      if (!await this.stf1(f)) return
      const blob = await this.blobde(f, true)
      if (blob) {
        saveAs(blob, this.nSt.note.nomFichier(f.idf))
      } else {
        await afficherDiag(this.$t('PNFgetEr'))
      }
    },

  },

  data () {
    return {
      texte: '',
      fc: null, // fichier courant
      itc: null // item courant
    }
  },

  setup (props) {
    const ui = stores.ui
    const session = stores.session
    const nSt = stores.note
    const aSt = stores.avatar
    const gSt = stores.groupe
    const avnSt = stores.avnote
    const ppSt = stores.pp
    const exp = reactive({})

    const ro = toRef(props, 'ro')
    const state = reactive({
      avn: null,
      listefic: []
    })

    const avatar = ref(null)
    const groupe = ref(null)
    const exv = ref(0)

    if (nSt.node.type === 4) {
      if (ro.value === 0 && aSt.exV2) exv.value = 1
      avatar.value = aSt.getElt(nSt.note.id).avatar
    } else if (nSt.node.type === 5) {
      groupe.value = gSt.egr(nSt.note.id).groupe
      if (ro.value === 0 && ergrV2()) exv.value = 2
    }

    function ergrV2 (dv) {
      const g = groupe.value
      const eg = gSt.egr(g.id)
      if (eg.objv.vols.v2 + dv >= eg.objv.vols.q2 * UNITEV2) return true
      return false
    }

    function initState () {
      const n = nSt.note
      state.avn = avnSt.getAvnote(n.id, n.ids)
      state.listefic = listefichiers(n, state.avn)
    }

    function listefichiers (n, avn) {
      const lst = []
      const mnom = {}
      for (const [idf, x] of n.mfa) {
        /* mfa : Map de clé idf : { nom, info, dh, type, gz, lg, sha } */
        const f = n.mfa.get(idf)
        let e = mnom[f.nom]; if (!e) { e = []; mnom[f.nom] = e; lst.push(f.nom) }
        const av = avn && (avn.lidf.indexOf(idf) !== -1) ? true : false
        e.push({ ...f, idf, av })
      }
      lst.sort((a, b) => { return a < b ? -1 : (a > b ? 1 : 0) })
      const res = []
      lst.forEach(nom => {
        const l = mnom[nom]
        l.sort((a, b) => { return a.dh < b.dh ? 1 : (a.dh > b.dh ? -1 : 0) })
        if (exp[nom] === undefined) exp[nom] = false
        res.push({ nom, l, avn: avn && avn.mnom[nom] ? true : false })
      })
      return res
    }

    initState()

    nSt.$onAction(({ name, args, after }) => { 
      after(async (result) => {
        if ((name === 'setNote')){
         const n = args[0]
         if (n.key === nSt.note.key) initState()
        }
      })
    })

    avnSt.$onAction(({ name, args, after }) => { 
      after(async (result) => {
        if ((name === 'setAvnote')){
         const n = args[0]
         if (n.key === nSt.note.key) initState()
        }
      })
    })

    ui.$onAction(({ name, args, after }) => { 
      after(async (result) => {
        if ((name === 'setFichiercree')){
          const nom = args[0]
          if (nom) {
            setTimeout(() => {
              exp[nom] = true
            }, 100)
            ui.setFichiercree('')
          }
        }
      })
    })

    const nouveaufichier = ref(false)
    function ovnouveaufichier () { MD.oD(nouveaufichier)}
    const supprfichier = ref(false)
    function ovsupprfichier () { MD.oD(supprfichier)}
    const confirmav1 = ref(false)
    function ovconfirmav1 () { MD.oD(confirmav1)}
    const confirmav2 = ref(false)
    function ovconfirmav2 () { MD.oD(confirmav2)}

    return {
      nouveaufichier, ovnouveaufichier, supprfichier, ovsupprfichier,
      confirmav1, ovconfirmav1, confirmav2, ovconfirmav2,
      ui, session, nSt, aSt, gSt, avnSt, ppSt,
      exv, avatar, groupe, state, exp,
      MD, ergrV2, edvol, dhcool
    }
  }

}
</script>

<style lang="sass" scoped>
@import '../css/app.sass'
.mh
  max-height: 3.2rem
  width: 15rem
.bord1
  border: 1px solid $grey-5
  border-radius: 5px
.bord2
  border: 3px solid $warning
  border-radius: 5px
.dec
  position: relative
  left: -7px
.h13
  height: 1.3rem
</style>
