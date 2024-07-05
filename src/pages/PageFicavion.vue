<template>
<q-page>
  
  <div v-if="lst.length === 0" class="titre-lg text-italic">{{$t('FAVnone')}}</div>

  <div v-else v-for="(x, idx) in lst" :key="x.f.id" 
    :class="dkli(idx) + ' zone cursor-pointer full-width q-mb-sm'" 
    @click="detail(x)">
    <q-card class="q-mx-xs">
      <div class="row justify-between items-center fs-md font-mono">
        <div>
          <q-icon name="zoom_in" size="md" color="primary" class="q-mr-sm"/>
          <span>{{x.f.nom}} - {{x.f.info}}</span>
        </div>
        <div class="row">
          <div v-if="x.f.st" class="text-italic q-mr-sm">{{$t('FAVst' + x.f.st)}}</div>
          <div class="q-pl-sm">{{edvol(x.f.lg)}}</div>
        </div>
      </div>
      <div class="q-ml-lg">{{x.n.label}}</div>
      <div class="q-ml-lg">{{x.r}}</div>
    </q-card>
    <q-separator class="q-my-xs"/>
  </div>

  <div class="filler"/>

  <q-dialog v-model="ui.d.FAdetaildial">
    <div :class="styp('md')">
      <q-toolbar class="bg-secondary text-white">
        <q-btn dense size="md" color="warning" padding="xs" icon="close" @click="ui.fD"/>
        <q-toolbar-title class="titre-lg text-center">{{$t('FAVdet')}}</q-toolbar-title>
        <bouton-help page="page1"/>
      </q-toolbar>
      <q-card class="q-pa-xs">
        <q-card-section class="q-pa-xs">
          <div class="row">
            <div class="col-2 fs-md text-italic">{{$t('FAVl7')}}</div>
            <div class="col-10 q-pl-sm font-mono">{{fc.f.nom}}</div>
          </div>
          <div class="row">
            <div class="col-2 fs-md text-italic">{{$t('FAVl8')}}</div>
            <div class="col-10 q-pl-sm font-mono">{{fc.f.info}}</div>
          </div>
          <div class="row">
            <div class="col-2 fs-md text-italic">{{$t('FAVl1')}}</div>
            <div class="col-10 q-pl-sm font-mono">{{fc.n.label}}</div>
          </div>
          <div class="row">
            <div class="col-2 fs-md text-italic">{{$t('FAVl2')}}</div>
            <div class="col-10 q-pl-sm font-mono">{{fc.r}}</div>
          </div>
          <div class="row">
            <div class="col-2 fs-md text-italic">{{$t('FAVl3')}}</div>
            <div class="col-10 q-pl-sm font-mono">{{edvol(fc.f.lg)}}</div>
          </div>
          <div class="row">
            <div class="col-2 fs-md text-italic">{{$t('FAVl4')}}</div>
            <div class="col-10 q-pl-sm font-mono">{{dhcool(fc.f.dh)}}</div>
          </div>
          <div v-if="fc.f.err" class="row">
            <div class="col-2 fs-md text-italic">{{$t('FAVl5')}}</div>
            <div class="col-10 q-pl-sm font-mono">{{fc.f.err}}</div>
          </div>
          <div v-if="fc.f.st" class="row">
            <div class="col-2 fs-md text-italic">{{$t('FAVl6')}}</div>
            <div class="col-10 q-pl-sm font-mono">{{$t('FAVst' + fc.f.st)}}</div>
          </div>
        </q-card-section>
        <q-card-actions align="right" class="q-gutter-sm">
          <q-btn color="primary" icon="check" dense padding="xs" size="md" 
            :label="$t('FAVb1')" @click="voirnote"/>
          <q-btn color="primary" dense padding="xs" size="md" icon="open_in_new"
            :label="$t('FAVb2')" @click="affFic"/>
          <q-btn color="primary" dense padding="xs" size="md" icon="save_alt" 
            :label="$t('FAVb3')" @click="enregFic"/>
        </q-card-actions>
      </q-card>
    </div>
  </q-dialog>

</q-page>
</template>

<script>
import { saveAs } from 'file-saver'
import { ref } from 'vue'
import stores from '../stores/stores.mjs'
import { afficherDiag, edvol, dhcool, dkli, styp } from '../app/util.mjs'
import BoutonHelp from '../components/BoutonHelp.vue'
import { idb } from '../app/db.mjs'

export default ({
  name: 'PageFicavion',

  components: { BoutonHelp },

  computed: {
    lst () {
      const l = []
      for (const [pk, f] of this.fSt.map) {
        const n = this.nSt.getNode(f.ids, f.ns)
        const r = this.nSt.getNode(n.rkey).label // ????????????????????
        l.push({f, n, r})
      }
      l.sort((a, b) => {
        return a.f.lg > b.f.lg ? -1 : (a.f.lg < b.f.lg ? 1 : 0)
      })
      return l
    }
  },

  data () {
    return {
      fc: null // fichier courant
    }
  },

  methods: {
    detail (fc) {
      this.fc = fc
      this.ui.oD('FAdetaildial')
    },

    voirnote () {
      this.nSt.setPreSelect(this.fc.n.key)
      this.ui.setPage('notes')
    },

    async blobde (b) {
      const buf = await this.fc.n.note.getFichier(this.fc.f.id)
      if (!buf || !buf.length) return null
      const blob = new Blob([buf], { type: this.fc.f.type })
      return b ? blob : URL.createObjectURL(blob)
    },

    async stf1 (f) { // visibilité d'un fichier
      if (f.estCharge) return true
      if (this.session.avion) {
        const avn = this.avnSt.getAvNote(f.ids, f.ns)
        const b = avn && ((avn.lidf.indexOf(f.id) !== -1) || (avn.mnom[f.nom] === f.id))
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
      if (!await this.stf1(this.fc.f)) return
      const u8 = await this.fc.n.note.getFichier(this.fc.f.id)
      if (!u8) {
        await afficherDiag(this.$t('PNFgetEr'))
        return
      }
      await idb.FLset(this.fc.f.nom, this.fc.f.info, this.fc.f.type, u8)
      this.ui.afficherMessage(this.$t('PNFcpp'))
      this.ppSt.modecc = false
      this.ppSt.setTabFichiers()
      this.ui.oD('pressepapier')
    },

    async affFic () {
      if (!await this.stf1(this.fc.f)) return
      const url = await this.blobde()
      if (url) {
        setTimeout(() => { window.open(url, '_blank') }, 100)
        console.log(url)
      } else {
        await afficherDiag(this.$t('PNFgetEr'))
      }
    },

    async enregFic () {
      if (!await this.stf1(this.fc.f)) return
      const blob = await this.blobde(true)
      if (blob) {
        saveAs(blob, this.fc.n.note.nomFichier(this.fc.f.id))
      } else {
        await afficherDiag(this.$t('PNFgetEr'))
      }
    }
  },

  setup () {
    const fSt = stores.fetat
    const nSt = stores.note
    const session = stores.session
    const avnSt = stores.avnote
    const ppSt = stores.pp
    const ui = stores.ui

    return {
      edvol, dhcool, dkli, styp,
      nSt, fSt, session, ppSt, avnSt, ui
      // lst
    }
  }
})
</script>

<style lang="sass" scoped>
@import '../css/app.sass'
@import '../css/input.sass'
.filler
  height: 2rem
.q-card > div
  box-shadow: inherit !important
</style>
