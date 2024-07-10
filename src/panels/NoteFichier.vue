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
          <btn-cond :disable="groupe && !aut" icon="add" :label="$t('PNFnvf')" 
            @ok="nouveau()"/>
        </div>
      </div>

      <div v-for="nom in note.lstNoms" :key="nom" class="full-width q-mb-sm">
        <div class="row justify-between full-width q-mb-sm">
          <div class="col q-pr-md">
            <span class="text-bold titre-md">{{nom}}</span>
            <q-icon v-if="mpn[nom][0].fa.avn" name="airplanemode_active" size="md" color="warning"/>
          </div>
          <btn-cond class="col-auto" :disable="groupe && !aut" icon="add" 
            :label="$t('PNFnvr')" @ok="nouveau(nom)"/>
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
              <menu-fichier class="q-ml-xs" :idf="e.f.id" 
                :aut="ro ? 0 : (estGr ? aut : 1)" :note="note"/>
            </div>
          </div>
        </div>
        <q-separator color="orange" size="2px" class="q-mb-sm"/>
      </div>
    </q-page>
  </q-page-container>

  <!-- Dialogue de création d'un nouveau fichier -->
  <nouveau-fichier v-if="ui.d.NFouvrir" :note="note" :nom="nomf || ''" 
    :aut="ro ? 0 : (estGr ? aut : 1)" :pasheb="pasHeb"/>

</q-layout>
</q-dialog>
</template>

<script>
import stores from '../stores/stores.mjs'
import { styp, sty, dkli, edvol, dhcool, suffixe } from '../app/util.mjs'
import BoutonHelp from '../components/BoutonHelp.vue'
import NouveauFichier from '../dialogues/NouveauFichier.vue'
import MenuFichier from '../components/MenuFichier.vue'
import NoteEcritepar from '../components/NoteEcritepar.vue'
import BtnCond from '../components/BtnCond.vue'
import { Note } from '../app/modele.mjs'
import ListeAuts from '../components/ListeAuts.vue'
import NodeParent from '../components/NodeParent.vue'
import { ID } from '../app/api.mjs'


export default {
  name: 'NoteFichier',

  components: { MenuFichier, BoutonHelp, NouveauFichier, NoteEcritepar, BtnCond, NodeParent, ListeAuts },

  props: { },

  computed: {
    note () { return this.nSt.note },
    nom () { return this.pSt.nom(this.note.id)},
    modifie () { return false },

    estGr () { return ID.estGroupe(this.note.id) },
    egr () { return this.estGr ? this.gSt.egr(this.note.id) : null },
    groupe () { return this.egr ? egr.groupe : null},

    // % quota de vf groupe - 0: ok, 1:90%, 2:>100% (RED)
    vgr () { return !this.groupe ? 0 : this.groupe.alVol(0) },

    // volume fichier du compte (si hébergeur pour un groupe)
    vcpt () { return this.groupe || !this.groupe.cptEstHeb ? 0 : this.session.compte.alVol(0) },

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

    async nouveau (nf) {
      this.nomf = nf || ''
      this.ui.oD('NFouvrir')
    }

  },

  data () {
    return {
      texte: '',
      aut: null,
      nomf: ''
    }
  },

  setup () {
     return {
      ui: stores.ui, 
      session: stores.session,
      nSt: stores.note, 
      pSt: stores.people, 
      gSt: stores.groupe, 

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
