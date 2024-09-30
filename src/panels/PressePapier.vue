<template>
<q-dialog v-model="ui.d.a.pressepapier" full-height position="left" persistent>
<q-layout container view="hHh lpR fFf" :class="styp('md')">
    <q-header elevated class="bg-secondary text-white">
      <q-toolbar>
        <btn-cond icon="chevron_left" color="warning" @ok="ui.fD"/>
        <q-toolbar-title class="titre-lg">{{$t('MLApp')}}</q-toolbar-title>
      </q-toolbar>
      <q-tabs class="titre-md" v-model="ppSt.tab" inline-label align="center" no-caps dense>
        <q-tab name="notes" :label="$t('PPnotes')" />
        <q-tab name="fichiers" :label="$t('PPfic')"/>
      </q-tabs>
    </q-header>

    <q-page-container>

    <div v-if="ppSt.tab==='notes'" class="q-pa-sm">
      <q-btn icon="add" dense flat color="primary" :label="$t('PPano')" @click="ajouternote"/>
      <div v-if="!ppSt.lstn.length" class="titre-lg text-italic">{{$t('PPnno')}}</div>
      <div v-else>
        <div v-for="(rec, idx) in ppSt.lstn" :key="rec.id" :class="'q-my-sm zone ' + dkli(idx)">
          <div class="row q-mb-xs justify-between items-center">
            <div class="fs-md font-mono">{{dhcool(rec.dh)}}
              <span class="q-ml-md fs-sm font-mono">#{{rec.id}}</span>
            </div>
            <btn-cond round icon="delete" color="warning" @ok="supprn(rec)"/>
          </div>
          <show-html class="bord1" :idx="idx" :texte="rec.txt" maxh="4rem" zoom edit @edit="editernote(rec)"/>
        </div>
      </div>
    </div>

    <div v-if="ppSt.tab==='fichiers'" class="q-pa-sm">
      <q-btn icon="add" dense flat color="primary" :label="$t('PPafi')" @click="ajouterfichier"/>
      <div v-if="!ppSt.lstf.length" class="titre-lg text-italic">{{$t('PPnfi')}}</div>
      <div v-else>
        <div v-for="(fic, idx) in ppSt.lstf" :key="fic.idf" :class="'q-my-sm zone ' + dkli(idx)">
          <div class="row justify-between items-center">
            <div class="fs-md font-mono">
              <span class="text-bold q-mr-md">{{fic.nom}}</span>
              <span>{{dhcool(fic.dh)}}</span>
              <span class="q-ml-md fs-sm font-mono">#{{fic.idf}}</span>
            </div>
            <div class="col-auto row">
              <div class="col-auto fs-md font-mono q-mr-sm">{{fic.type}}</div>
              <div class="col-auto fs-md font-mono">{{edvol(fic.lg)}}</div>
            </div>
          </div>
          <div class="q-mx-md fs-md text-italic">{{fic.info || $t('PPnoi')}}</div>
          <div class="q-mb-lg row items-center justify-end q-gutter-sm">
            <btn-cond v-if="!ppSt.modecc" class="col-auto" :label="$t('afficher')" @ok="affFic(fic)"
              icon="open_in_new"/>
            <btn-cond v-if="!ppSt.modecc" class="col-auto" :label="$t('enreg')" @ok="enregFic(fic)"
              icon="save"/>
            <btn-cond v-if="ppSt.modecc" class="col-auto" :label="$t('copier')" @ok="selFic(fic)"
              icon="content_copy"/>
            <btn-cond v-if="!ppSt.modecc" @ok="editerfichier(fic)"
              round icon="mode_edit" color="primary"/>
            <btn-cond v-if="!ppSt.modecc" @click="supprfichier(fic)"
              round icon="delete" color="warning"/>
          </div>
        </div>
      </div>
    </div>

    <div class="filler"/>

    <q-dialog v-model="ui.d[idc].PPnvnote" persistent>
      <q-card :class="styp('md')">
        <q-card-section>
          <div class="titre-lg">{{$t(rec ? 'PPnv1' : 'PPnv2')}}</div>
          <editeur-md mh="16rem" v-model="txt" :texte="rec ? rec.txt : ''" editable modetxt :lgmax="lgmax"/>
        </q-card-section>
        <q-card-actions align="right" class="q-gutter-sm">
          <btn-cond flat icon="undo" :label="$t('renoncer')" @ok="ui.fD"/>
          <btn-cond icon="check"
            :label="$t('valider')" :disable="!txt || (rec && txt === rec.txt)" @click="majnote"/>
        </q-card-actions>
      </q-card>
    </q-dialog>

    <q-dialog v-model="ui.d[idc].PPnvfic" persistent>
      <q-card :class="styp('md')">
      <q-card-section>
        <div class="titre-lg">{{$t(fic.id ? 'PPl1' : 'PPl2')}}</div>
        <q-file class="full-width" v-model="fileList" :label="$t('PPl3')"
          max-file-size="50000000" max-file="1"/>
        <div v-if="fic.lg" class="font-mono fs-sm">{{fic.nom}} - {{fic.type}} - {{fic.lg}}o</div>
        <nom-generique class="q-mt-md fs-md" v-model="nomfic" :label="$t('PPndf')"
          :lgmin="min" :lgmax="max1" :placeholder="$t('PPphf')"/>
        <nom-generique class="q-mt-md fs-md" v-model="info" :label="$t('PPapf')"
          :lgmin="0" :lgmax="max2" :placeholder="$t('PPphf')"/>
      </q-card-section>
      <q-card-actions align="right" class="q-gutter-sm">
        <btn-cond flat icon="undo" :label="$t('renoncer')" @ok="ui.fD"/>
        <btn-cond icon="check" :label="$t('valider')" :disable="!valide" @ok="majfic"/>
      </q-card-actions>
      </q-card>
    </q-dialog>

    <q-dialog v-model="ui.d[idc].PPsupprnote" persistent>
      <q-card :class="styp('sm')">
        <q-card-section class="column items-center q-my-md">
          <div class="titre-md text-center text-italic">{{$t('PPsuppn')}}</div>
          <div class="q-mt-sm fs-md font-mono text-bold">{{rec.titre}}</div>
        </q-card-section>
        <q-card-actions align="right"  class="q-gutter-sm">
          <btn-cond flat icon="undo" :label="$t('renoncer')"  @ok="ui.fD"/>
          <btn-cond color="warning" icon="delete" :label="$t('confirmer')" @ok="cfSupprnote" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <q-dialog v-model="ui.d[idc].PPsupprfic" persistent>
      <q-card :class="styp('sm')">
        <q-card-section class="column items-center q-my-md">
          <div class="titre-md text-center text-italic">{{$t('PPsuppf')}}</div>
          <div class="q-mt-sm fs-md font-mono text-bold">{{fic.titre}}</div>
        </q-card-section>
        <q-card-actions align="right" class="q-gutter-sm">
          <btn-cond flat icon="undo" :label="$t('renoncer')" @ok="ui.fD"/>
          <btn-cond color="warning" icon="delete" :label="$t('confirmer')" @ok="cfSupprfic" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    </q-page-container>

  </q-layout>
</q-dialog>
</template>

<script>
import { ref, onUnmounted } from 'vue'

import { saveAs } from 'file-saver'
import stores from '../stores/stores.mjs'
import ShowHtml from '../components/ShowHtml.vue'
import { readFile, dhcool, edvol, afficherDiag, dkli, styp } from '../app/util.mjs'
import EditeurMd from '../components/EditeurMd.vue'
import { idb } from '../app/db.mjs'
import NomGenerique from '../components/NomGenerique.vue'
import BtnCond from '../components/BtnCond.vue'
import { interdits, regInt } from '../app/api.mjs'

export default ({
  name: 'PressePapier',

  components: { ShowHtml, EditeurMd, NomGenerique, BtnCond },

  data () {
    return {
      dhcool: dhcool,
      edvol: edvol,
      info: '',
      nomfic: '',
      rec: null,
      fic: { nom: '', info: '', lg: 0, type: '', u8: null },
      txt: '',
      min: 4,
      max1: 32,
      max2: 16
    } 
  },

  computed: {
    valide () { return this.fic.lg && this.nomfic && this.r1(this.nomfic) === true && this.r1(this.info) === true }
  },

  watch: {
    async fileList (file) {
      if (file) {
        const { size, name, type, u8 } = await readFile(file, true)
        this.fic = {nom: name, lg: size, type, u8 }
      }
    },
    fic (ap) {
      this.nomfic = ap.nom || ''
      this.info = ''
      this.fileList = null
    }
  },

  methods: {
    r2 (val) { return val.length < this.min || val.length > this.max ? this.$t('NAe1') : true },
    r1 (val) { return regInt.test(val) ? this.$t('NAe2') : true },

    ajouternote () {
      this.rec = null
      this.txt = ''
      this.ui.oD('PPnvnote', this.idc)
    },
    editernote (rec) {
      this.rec = rec
      this.txt = ''
      this.ui.oD('PPnvnote', this.idc)
    },
    supprn (rec) {
      this.rec = rec
      this.ui.oD('PPsupprnote', this.idc)
    },
    async cfSupprnote () {
      await idb.NLdel(this.rec.id)
      this.ui.fD()
    },
    async majnote () {
      await idb.NLset(this.txt, this.rec ? this.rec.id : 0)
      this.ui.fD()
    },

    async majfic () {
      const f = this.fic
      await idb.FLset(this.nomfic, this.info, f.type, f.u8)
      this.ui.fD()
    },
    ajouterfichier () {
      this.fic = { nom: '', info: '', lg: 0, type: '', u8: null }
      this.ui.oD('PPnvfic', this.idc)
    },
    async editerfichier (fic) {
      this.info = fic.info
      this.nomfic = fic.nom
      const u8 = await fic.getU8()
      this.fic = { idf: fic.id, nom: fic.nom, info: fic.info, 
        lg: fic.lg, type: fic.type, u8 }
      this.ui.oD('PPnvfic', this.idc)
    },
    supprfichier (fic) {
      this.fic = fic
      this.ui.oD('PPsupprfic', this.idc)
    },
    async cfSupprfic () {
      await idb.FLdel(this.fic.idf)
      this.ui.fD()
    },

    async blobde (f, b) {
      const buf = await f.getU8()
      if (!buf || !buf.length) return null
      const blob = new Blob([buf], { type: f.type })
      return b ? blob : URL.createObjectURL(blob)
    },

    async selFic (fx) {
      const u8 = await fx.getU8()
      if (!u8) {
        await afficherDiag(this.$t('PPerrb'))
        this.ui.fD()
        this.ppSt.copiercollerfic(false)
      } else {
        fx.u8 = u8
        this.ui.fD()
        this.ppSt.copiercollerfic(fx)
      }
    },

    async affFic (f) {
      const url = await this.blobde(f)
      if (url) {
        setTimeout(() => { window.open(url, '_blank') }, 500)
      } else {
        afficherDiag(this.$t('PPerrb'))
      }
    },

    async enregFic (f) {
      const blob = await this.blobde(f, true)
      if (blob) {
        saveAs(blob, f.nomFichier)
      } else {
        afficherDiag(this.$t('PPerrb'))
      }
    }

  },

  setup () {
    const session = stores.session
    const ui = stores.ui
    const idc = ui.getIdc(); onUnmounted(() => ui.closeVue(idc))
    const ppSt = stores.pp
    const cfg = stores.config
    const lgmax = cfg.maxlgtextenote
    const fileList = ref(null)

    return {
      dkli, styp,
      session, ppSt, ui, idc,
      lgmax, fileList, interdits
    }
  }
})
</script>

<style lang="sass" scoped>
@import '../css/app.sass'
.filler
  height: 2rem
.q-toolbar
  padding: 0 !important
  min-height: 0 !important
.bord1
  border-radius: 5px
  border: 1px solid $grey-5
  padding: 2px
</style>
