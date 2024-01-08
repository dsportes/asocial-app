<template>
<q-dialog v-model="ui.d.NF" full-height position="left" persistent>
  <q-layout container view="hHh lpR fFf" :class="styp('md')">
  <q-header elevated class="bg-secondary text-white">
    <q-toolbar>
      <q-btn dense size="md" color="warning" icon="chevron_left" padding="xs" @click="fermer"/>
      <q-toolbar-title v-if="avatar" 
        class="titre-lg full-width text-center">{{$t('PNOfictit1', [avatar.na.nom])}}</q-toolbar-title>
      <q-toolbar-title v-if="groupe" 
        class="titre-lg full-width text-center">{{$t('PNOfictit2', [groupe.na.nomc])}}</q-toolbar-title>
      <bouton-help page="page1"/>
    </q-toolbar>
    <q-toolbar v-if="ro !==0 || exv" inset
      class="full-width bg-yellow-5 text-black titre-md text-bold">
      <div class="row justify-center">
        <q-icon name="warning" color="warning" size="md" class="q-mr-sm"/>
        <span v-if="ro">{{$t('PNOro' + ro)}}</span>
        <span v-if="exv">{{$t('PNOexv2' + exv)}}</span>
      </div>
    </q-toolbar>
    <div class="full-width row justify-between items-center">
      <note-ecritepar v-if="nSt.node.type === 5" 
        :groupe="groupe" :note="nSt.note" @ok="selNa" fic="a"/>
      <q-btn :disable="nSt.node.type === 5 && !naAut" 
        dense color="primary" class="q-mt-sm" size="md" padding="xs" icon="add"
        :label="$t('PNFnvaj')" @click="nouveau()"/>
    </div>
  </q-header>

  <q-page-container>
    <q-page class="q-pa-xs column items-center">

      <div v-for="it in state.listefic" :key="it.nom" class="full-width">

        <div class="row items-center">
          <div class="col-4 fs-lg font-mono text-bold">{{it.nom}}</div>
          <q-toggle class="col-6 titre-sm" v-model="state.noms[it.nom]"
            checked-icon="airplanemode_active"
            :color="state.noms[it.nom] ? 'green': 'grey'"
            :label="$t('PNFavion1')"
            unchecked-icon="airplanemode_inactive"
            @click.stop="av1Chg(it)"
            :disable="!(session.synchro || session.avion)"
          />
          <q-btn class="col-2" dense color="primary" size="sm" icon="add"
            :label="$t('PNFversion')" @click="nouveau(it.nom)"/>
        </div>

        <div v-for="(f, idy) in it.l" :key="f.idf" :class="dkli(idy) + 'q-my-sm q-ml-lg'">
          <div class="row items-start">
            <div class="col-3 font-mono info">{{f.info || '-'}}</div>
            <div class="col row justify-between">
              <div class="fs-sm">
                <span class="q-mr-sm">#{{suffixe(f.idf)}}</span>
                <span class="q-mr-sm">{{f.type}}</span>
                <span>{{edvol(f.lg)}}</span>
              </div>
              <div class="font-mono fs-sm q-mr-sm">{{dhcool(f.dh, true)}}</div>
            </div>

            <div class="col-auto">
              <q-btn dense size="md" round padding="none"
                :icon="(it.avn && idy === 0) || state.idfs[f.idf] ? 'airplanemode_active' : 'airplanemode_inactive'" 
                :color="(it.avn && idy === 0) || state.idfs[f.idf] ? 'green': 'grey'">
                <q-menu anchor="bottom left" self="top left" max-height="10rem" 
                  max-width="25rem">
                  <q-list class="q-py-xs bord1 bg-black text-white">
                    <q-item v-if="it.avn && idy === 0" 
                      class="titre-md text-italic" clickable v-close-popup>
                      {{$t('PNFl4')}}
                    </q-item>
                    <q-item clickable v-close-popup>
                      <q-toggle class="titre-md" v-model="state.idfs[f.idf]" v-close-popup
                        checked-icon="airplanemode_active"
                        :color="state.idfs[f.idf] ? 'green': 'grey'"
                        :label="$t('PNFl7')"
                        unchecked-icon="airplanemode_inactive"
                        @click.stop="av2Chg(f)"
                        :disable="!(session.synchro || session.avion)"
                      />
                    </q-item>
                  </q-list>
                </q-menu>
              </q-btn>

            <q-btn class="q-ml-xs" dense size="md" round padding="none" icon="more_vert" color="primary">
              <q-menu anchor="bottom left" self="top left" max-height="10rem" 
                max-width="20rem">
                <q-list class="q-py-xs bord1 bg-black text-white">
                  <q-item clickable v-close-popup  @click="copierFic(f)">
                    <q-item-section avatar><q-icon color="primary" name="content_copy" /></q-item-section>
                    <q-item-section>{{$t('PNFcop')}}</q-item-section>
                  </q-item>
                  <q-item clickable v-close-popup  @click="affFic(f)">
                    <q-item-section avatar><q-icon color="primary" name="open_in_new" /></q-item-section>
                    <q-item-section>{{$t('PNFaff')}}</q-item-section>
                  </q-item>
                  <q-item clickable v-close-popup  @click="enregFic(f)">
                    <q-item-section avatar><q-icon color="primary" name="save" /></q-item-section>
                    <q-item-section>{{$t('PNFenreg')}}</q-item-section>
                  </q-item>
                  <q-item clickable v-close-popup  @click="supprFic(f)">
                    <q-item-section avatar><q-icon color="warning" name="delete" /></q-item-section>
                    <q-item-section>{{$t('PNFsuppr')}}</q-item-section>
                  </q-item>
                </q-list>
              </q-menu>
            </q-btn>
            </div>
          </div>
        </div>
        <q-separator color="orange" size="2px" class="q-mb-sm"/>
      </div>
    </q-page>
  </q-page-container>

  <!-- Dialogue de création d'un nouveau fichier -->
  <nouveau-fichier v-if="ui.d.NFouvrir" :nomfic="nomfic" :na="naAut"/>

  <!-- Confirmation de suppression -->
  <q-dialog v-model="ui.d.NFsupprfichier" persistent>
    <q-card :class="styp('sm') + ' q-pa-sm'">
      <q-card-section class="column items-center q-my-md">
        <div class="titre-md text-center text-italic">{{$t('PNFsf')}}</div>
        <div class="q-mt-sm fs-md font-mono text-bold">{{f.nom}} - {{f.info}}</div>
      </q-card-section>
      <q-card-actions align="right" class="q-gutter-sm">
        <q-btn flat dense size="md" padding="xs" color="primary" icon="undo"
          :label="$t('renoncer')" @click="ui.fD" />
        <q-btn dense size="md" padding="xs" color="warning" icon="delete"
          :label="$t('confirmer')" @click="cfSuppr" />
      </q-card-actions>
    </q-card>
  </q-dialog>

  <!-- Confirmation visible en mode avion par nom -->
  <q-dialog v-model="ui.d.NFconfirmav1" persistent>
    <q-card :class="styp('sm') + ' q-pa-sm'">
      <q-card-section class="column items-center q-my-md">
        <div class="titre-md text-center text-italic">{{$t('PNFav1')}}</div>
        <div class="q-mt-sm fs-md font-mono text-bold">{{itc.nom}}</div>
      </q-card-section>
      <q-card-actions align="right" class="q-gutter-sm">
        <q-btn flat dense size="md" padding="xs" color="primary" icon="undo"
          :label="$t('renoncer')" @click="cfAvnom(false)" />
        <q-btn dense size="md" padding="xs" color="warning" icon="delete"
          :label="$t('confirmer')" @click="cfAvnom(true)" />
      </q-card-actions>
    </q-card>
  </q-dialog>

  <!-- Confirmation visible en mode avion par version -->
  <q-dialog v-model="ui.d.NFconfirmav2" persistent>
    <q-card :class="styp('sm') + ' q-pa-sm'">
      <q-card-section class="column items-center q-my-md">
        <div class="titre-md text-center text-italic">{{$t('PNFav2')}}</div>
        <div class="q-mt-sm fs-md font-mono text-bold">{{fc.nom}} - {{fc.info}}</div>
      </q-card-section>
      <q-card-actions align="right" class="q-gutter-sm">
        <q-btn flat dense size="md" padding="xs" color="primary" icon="undo"
          :label="$t('renoncer')" @click="cfAvidf(false)" />
        <q-btn dense size="md" padding="xs" color="warning" icon="delete"
          :label="$t('confirmer')" @click="cfAvidf(true)" />
      </q-card-actions>
    </q-card>
  </q-dialog>

</q-layout>
</q-dialog>
</template>

<script>
import stores from '../stores/stores.mjs'
import { $t, styp, sty, dkli, edvol, dhcool, afficherDiag, suffixe, trapex } from '../app/util.mjs'
import BoutonHelp from '../components/BoutonHelp.vue'
import NouveauFichier from '../dialogues/NouveauFichier.vue'
import NoteEcritepar from '../components/NoteEcritepar.vue'
import { isAppExc, UNITEV2 } from '../app/api.mjs'
import { saveAs } from 'file-saver'
import { SupprFichier } from '../app/operations.mjs'
import { gestionFichierMaj, FLset } from '../app/db.mjs'

export default {
  name: 'NoteFichier',

  components: { BoutonHelp, NouveauFichier, NoteEcritepar },

  props: { },

  computed: {
    modifie () { return false },
    id () { return this.nSt.note.id },
    avn () { 
      const n = this.nSt.note
      return this.avnSt.getAvnote(n.id, n.ids)
    },
    estGr () { return this.nSt.node.type === 5 },
    groupe () { return this.estGr ? this.gSt.egr(this.id).groupe : null },
    avatar () { return !this.estGr ? this.aSt.getElt(this.id).avatar : null },
    exv () { if (this.ro) return 0 
      if (!this.estGr) return this.aSt.exV2
      const eg = this.gSt.egr(this.id)
      return (eg.objv.vols.v2 + dv >= eg.objv.vols.q2 * UNITEV2)
    },

    ro () { 
      /* Retourne 
      1: avion 2:figée 3:minimal 4:lecture
      5: note archivée (inutilisé)
      6: exclu (pour un autre compte), 
      7: pas auteur
      */
      const x = this.session.roSt // 1:avion 2:figée 3:minimal 4:lecture
      if (x) return x
      // const n = this.nSt.note; if (n.p) return 5 // note archivée
      if (!this.estGr) return 0
      if (this.groupe) {
        const s = this.groupe.avcAuteurs()
        if (!s.size) return 7 // pas auteur 
        const xav = this.nSt.mbExclu
        if (xav && !xav.avc) return 6 // un autre membre a l'exclusivité
      }
      return 0
    },

    state () {
      try {
        const state = { noms: {}, idfs: {}, listefic: [], avn: this.avn }
        const avn = state.avn
        const lst = []
        const mnom = {}
        for (const [idf, f] of this.nSt.note.mfa) {
          /* mfa : Map de clé idf : { nom, info, dh, type, gz, lg, sha } */
          let e = mnom[f.nom]; 
          if (!e) { 
            state.noms[f.nom] = avn && avn.mnom[f.nom] ? true : false
            e = []
            mnom[f.nom] = e
            lst.push(f.nom) 
          }
          const av = avn && (avn.lidf.indexOf(idf) !== -1) ? true : false
          state.idfs[idf] = av
          e.push({ ...f, idf, av })
        }
        lst.sort((a, b) => { return a < b ? -1 : (a > b ? 1 : 0) })
        lst.forEach(nom => {
          const l = mnom[nom]
          l.sort((a, b) => { return a.dh < b.dh ? 1 : (a.dh > b.dh ? -1 : 0) })
          state.listefic.push({ nom, l, avn: avn && avn.mnom[nom] ? true : false })
        })
        return state
      } catch (e) { 
        trapex(e, 1)
        return { noms: {}, idfs: {}, listefic: [], avn: this.avn }
      }
    }
  },

  watch: {
  },

  methods: {
    fermer () { if (this.modifie) this.ui.oD('confirmFerm'); else this.ui.fD() },

    async nouveau (nf) {
      if (!await this.session.edit()) return
      this.nomfic = nf
      this.ui.oD('NFouvrir')
    },

    async supprFic (f) {
      if (!await this.session.edit()) return
      this.f = f
      this.ui.oD('NFsupprfichier')
    },

    async cfSuppr() {
      const aut = !this.naAut ? 0 : this.aSt.compte.imGA(this.nSt.note.id, this.naAut.id)
      await new SupprFichier().run(this.nSt.note, this.f.idf, aut)
      this.ui.fD()
    },

    async avidf (f) {
      if (this.session.avion) {
        await afficherDiag(this.$t('PNFav3'))
        return
      }
      setTimeout(async () => {
        const err = await gestionFichierMaj(this.nSt.note, true, f.idf, '')
        if (isAppExc(err)) this.ui.fD()
      }, 50)
    },

    async av1Chg (it) {
      if (this.session.incognito) return
      const v = this.state.noms[it.nom]
      if (this.session.avion) {
        // this.state.noms[it.nom] = !v
        await afficherDiag(this.$t('PNFav3'))
        return
      }
      if (v) {
        await gestionFichierMaj(this.nSt.note, true, 0, it.nom)
      } else {
        this.itc = it
        this.ui.oD('NFconfirmav1')
      }
    },

    async cfAvnom (cf) {
      this.ui.fD()
      if (cf)
        await gestionFichierMaj(this.nSt.note, false, 0, this.itc.nom)
      else this.state.noms[this.itc.nom] = false
    },

    async av2Chg (f) {
      if (this.session.incognito) return
      const v = this.state.idfs[f.idf]
      if (this.session.avion) {
        // this.state.idfs[f.idf] = !v
        await afficherDiag(this.$t('PNFav3'))
        return
      }
      if (v) {
        await gestionFichierMaj(this.nSt.note, true, f.idf, '')
      } else {
        this.fc = f
        this.ui.oD('NFconfirmav2')
      }
    },

    async cfAvidf (cf) {
      this.ui.fD()
      if (cf)
        await gestionFichierMaj(this.nSt.note, false, this.fc.idf, '')
      else this.state.idfs[this.fc.idf] = false
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
      try {
        await FLset(f.nom, f.info, f.type, u8) // throw AppExc
      } catch (e) { await trapex (e, 2) } // ferme le dialogue
      this.ui.afficherMessage(this.$t('PNFcpp'))
      this.ppSt.modecc = false
      this.ppSt.setTabFichiers()
      this.ui.oD('pressepapier')
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

    selNa (elt) { 
      this.naAut = elt.na
    },

    ergrV2 (dv) {
      const eg = this.gSt.egr(this.id)
      return (eg.objv.vols.v2 + dv >= eg.objv.vols.q2 * UNITEV2)
    }

  },

  data () {
    return {
      texte: '',
      naAut: null,
      fc: null, // fichier courant
      itc: null // item courant
    }
  },

  setup () {
     return {
      ui: stores.ui, 
      session: stores.session,
      nSt: stores.note, 
      aSt: stores.avatar, 
      gSt: stores.groupe, 
      avnSt: stores.avnote, 
      ppSt: stores.pp,
      styp, sty, dkli, edvol, dhcool, suffixe
    }
  }

}
</script>

<style lang="sass" scoped>
@import '../css/app.sass'
.bord1
  border: 1px solid $grey-5
  border-radius: 5px
.info
  max-height: 1.6rem !important
  overflow: hidden
</style>
