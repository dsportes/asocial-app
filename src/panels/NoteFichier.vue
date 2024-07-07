<template>
<q-dialog v-model="ui.d.NF" full-height position="left" persistent>
  <q-layout container view="hHh lpR fFf" :class="styp('md')">
  <q-header elevated class="bg-secondary text-white">
    <q-toolbar>
      <btn-cond color="warning" icon="chevron_left" @ok="ui.fD"/>
      <q-toolbar-title class="titre-lg full-width text-center">
        {{$t(nSt.note.deGroupe ? 'PNOngr' : 'PNOnper', [nom])}}
      </q-toolbar-title>      
      <bouton-help page="page1"/>
    </q-toolbar>
    <q-toolbar v-if="ro" inset class="full-width msg">{{$t('PNOro')}} - {{ro}}</q-toolbar>
    <q-toolbar v-if="red" inset class="full-width msg">{{$t('PNOred')}} - {{red}}</q-toolbar>
    <q-toolbar v-if="!ro && vcpt === 1" inset class="full-width">{{$t('PNOcpt1')}}</q-toolbar>
    <q-toolbar v-if="!ro && vgr === 1" inset class="full-width">{{$t('PNOcpt1')}}</q-toolbar>
  </q-header>

  <q-page-container>
    <q-page class="q-pa-xs column items-center">
      <q-expansion-item class="full-width q-my-xs" dense :label="$t('PNOapropos')" header-class="bg-secondary text-white">
        <div class="q-pa-sm">
          <node-parent />
          <q-separator class="q-my-sm" color="orange"/>
          <liste-auts class="q-my-sm"/>
        </div>
      </q-expansion-item>

      <div class="full-width bg-secondary text-white row justify-between items-center">
        <div class="col titre-md q-pa-xs">
          {{$t('PNOlstfic', note.mfa.size, {count: note.mfa.size}) + (note.mfa.size ? ' - ' + edvol(note.vf) : '')}}
        </div>
        <div v-if="!ro" class="col-auto row">
          <note-ecritepar v-if="groupe" :groupe="groupe" @ok="selAut"/>
          <btn-cond :disable="groupe && !aut" icon="add" :label="$t('PNFnvaj')" @ok="nouveau()"/>
        </div>
      </div>

      <div v-for="nom in note.lstNoms" :key="nom" class="full-width q-mb-sm">
        <div class="row justify-between full-width  q-mb-sm">
          <span class="text-bold titre-md">{{nom}}</span>
          <q-icon v-if="mpn[nom][0].fa.avn" name="airplanemode_active" size="md" color="warning"/>
        </div>
        <div v-for="e in mpn[nom]" :key="e.f.idf" class="q-ml-lg">
          <div class="row justify-between full-width">
            <div class="col">
              <span class="font-mono">{{e.f.idf}}</span>
              <span class="q-mr-sm">{{e.f.type}}</span>
              <span>{{edvol(e.f.lg)}}</span>
            </div>
            <div class="col-auto">
              <span class="font-mono fs-sm q-mr-sm">{{dhcool(f.dh, true)}}</span>
              <q-icon class="q-ml-xs" v-if="e.fa.av" name="airplanemode_active" size="md" color="primary"/>
              <btn-cond class="q-ml-xs" icon="more_vert" @ok="detail(e)"/>
            </div>
          </div>
        </div>
        <q-separator color="orange" size="2px" class="q-mb-sm"/>
      </div>

      <!--
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
      -->
    </q-page>
  </q-page-container>

  <!-- Détail d'un fichier -->
  <detail-fichier v-if="ui.d.DFouvrir" :note="note" :idf="fc.f.idf" :ro="ro"/>

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
import BtnCond from '../components/BtnCond.vue'
import { Note } from '../app/modele.mjs'
import ListeAuts from '../components/ListeAuts.vue'
import NodeParent from '../components/NodeParent.vue'
import { isAppExc, UNITEV, ID } from '../app/api.mjs'
import { saveAs } from 'file-saver'
import { SupprFichier } from '../app/operations.mjs'
import { gestionFichierMaj, FLset } from '../app/db.mjs'

export default {
  name: 'NoteFichier',

  components: { BoutonHelp, NouveauFichier, NoteEcritepar, BtnCond, NodeParent, ListeAuts },

  props: { },

  computed: {
    note () { return this.nSt.note },
    nom () { return this.pSt.nom(this.note.id)},
    modifie () { return false },

    estGr () { return ID.estGroupe(this.note.id) },
    egr () { return this.estGr ? this.gSt.egr(this.note.id) : null },
    groupe () { return this.egr ? egr.groupe : null},

    // % quota de vf groupe - 0: ok, 1:90%, 2:>100% (RED)
    vgr () { if (!this.groupe || this.groupe.pcv < 90) return 0
      return this.groupe.pcv > 100 ? 2 : 1
    },

    // volume fichier du compte (si hébergeur pour un groupe)
    vcpt () {
      if (!this.estGr) {
        const pc = this.session.compte.pcv
        return pc > 100 ? 2 : (pc > 90 ? 1 : 0) 
      }
      if (!this.groupe || !this.groupe.cptEstHeb) return 0
      const pcv = this.compte.qv.pcv
      return pcv > 100 ? 2 : (pcv > 90 ? 1 : 0)
    },

    pasHeb () { return this.groupe && !this.groupe.imh },

    cptOkExclu () { return !this.groupe || this.groupe.cptOkExclu },

    editn () { return Note.idasEdit(this.nSt.node).size > 0 },

    ro () { return this.session.cEdit ? this.session.cEdit :
      (!this.cptOkExclu ? this.$t('PNOexclu') : (!this.editn ? this.$t('PNOnoedit') : ''))
    },

    red () { return !this.ro && (this.pasHeb ? this.$t('PNOpasheb') : 
      (this.vcpt === 2 ? this.$t('PNOvcpt2') : (this.vgr === 2 ? this.$t('PNOvgr2') : false)))
    },
    
    mpn () {
      const m = new Map()
      for(const nom of this.note.lstNoms) {
        const l = []
        for(const f of this.note.fnom[nom]) l.push[{f, fa: this.faSt.map.get(f.idf) || { }}]
        m.set[nom, l]
      }
      return m
    }
  },

  watch: {
  },

  methods: {
    fermer () { if (this.modifie) this.ui.oD('confirmFerm'); else this.ui.fD() },

    selAut (elt) { this.aut = elt },

    detail (e) {
      this.fc = e
      this.ui.oD('DFouvrir')
    },

    /****************************/

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
        await idb.FLset(f.nom, f.info, f.type, u8) // throw AppExc
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

    ergrV2 (dv) {
      const eg = this.gSt.egr(this.id)
      return (eg.objv.vols.v2 + dv >= eg.objv.vols.q2 * UNITEV)
    }

  },

  data () {
    return {
      texte: '',
      aut: null,
      fc: null, // fichier courant
      itc: null // item courant
    }
  },

  setup () {
     return {
      ui: stores.ui, 
      session: stores.session,
      nSt: stores.note, 
      pSt: stores.people, 
      gSt: stores.groupe, 
      faSt: stores.ficav, 
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
