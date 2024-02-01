<template>
<q-dialog v-model="ui.d.pressepapier" full-height position="left" persistent>
<q-layout container view="hHh lpR fFf" :class="styp('md')">
    <q-header elevated class="bg-secondary text-white">
      <q-toolbar>
        <q-btn dense size="md" icon="chevron_left" color="warning" @click="ui.fD"/>
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
            <q-btn dense size="md" round paddind="none" icon="delete" color="warning" @click="supprn(rec)"/>
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
              <span class="q-ml-md fs-sm font-mono">#{{fic.id}}</span>
            </div>
            <div class="col-auto row">
              <div class="col-auto fs-md font-mono">{{fic.type}}</div>
              <div class="col-auto fs-md font-mono">{{edvol(fic.lg)}}</div>
            </div>
          </div>
          <div class="q-mx-md fs-md text-italic">{{fic.info || $t('PPnoi')}}</div>
          <div class="q-mb-lg row items-center justify-end q-gutter-sm">
            <q-btn v-if="!ppSt.modecc" class="col-auto" :label="$t('afficher')" @click="affFic(fic)"
              size="sm" dense color="primary" padding="none" icon="open_in_new"/>
            <q-btn v-if="!ppSt.modecc" class="col-auto" :label="$t('enreg')" @click="enregFic(fic)"
              size="sm" dense color="primary" padding="none" icon="save"/>
            <q-btn v-if="ppSt.modecc" class="col-auto" :label="$t('copier')" @click="selFic(fic)"
              size="sm" dense color="primary" padding="none" icon="copy"/>
            <q-btn v-if="!ppSt.modecc" @click="editerfichier(fic)"
              dense size="md" padding="none" round icon="mode_edit" color="primary"/>
            <q-btn v-if="!ppSt.modecc" @click="supprfichier(fic)"
              dense size="md" padding="none" round icon="delete" color="warning"/>
          </div>
        </div>
      </div>
    </div>

    <div class="filler"/>

    <q-dialog v-model="ui.d.PPnvnote" persistent>
      <q-card :class="styp('md')">
        <q-card-section>
          <div class="titre-lg">{{$t(rec ? 'PPnv1' : 'PPnv2')}}</div>
          <editeur-md mh="16rem" v-model="txt" :texte="rec ? rec.txt : ''" editable modetxt :lgmax="lgmax"/>
        </q-card-section>
        <q-card-actions align="right" class="q-gutter-sm">
          <q-btn flat color="primary" dense padding="xs" size="md" icon="undo" 
            :label="$t('renoncer')" @click="ui.fD"/>
          <q-btn color="primary" dense padding="xs" size="md" icon="check"
            :label="$t('valider')" :disable="!txt || (rec && txt === rec.txt)" @click="majnote"/>
        </q-card-actions>
      </q-card>
    </q-dialog>

    <q-dialog v-model="ui.d.PPnvfic" persistent>
      <q-card :class="styp('md')">
      <q-card-section>
        <div class="titre-lg">{{$t(fic.id ? 'PPl1' : 'PPl2')}}</div>
        <q-file class="full-width" v-model="fileList" :label="$t('PPl3')"
          max-file-size="50000000" max-file="1"/>
        <div v-if="fic.lg" class="font-mono fs-sm">{{fic.nom}} - {{fic.type}} - {{fic.lg}}o</div>
        <nom-generique class="q-mt-md fs-md" v-model="nomfic" :label="$t('PPndf')"
          :init-val="fic.nom" :lgmin="4" :lgmax="32" :placeholder="$t('PPphf')"/>
        <nom-generique class="q-mt-md fs-md" v-model="info" :label="$t('PPapf')"
          :init-val="fic.info || ''" :lgmin="0" :lgmax="40" :placeholder="$t('PPphf')"/>
      </q-card-section>
      <q-card-actions align="right" class="q-gutter-sm">
        <q-btn flat color="primary" dense icon="undo" padding="xs" size="md"
          :label="$t('renoncer')" @click="ui.fD"/>
        <q-btn color="primary" dense icon="check" padding="xs" size="md"
          :label="$t('valider')" :disable="!valide" @click="majfic"/>
      </q-card-actions>
      </q-card>
    </q-dialog>

    <q-dialog v-model="ui.d.PPsupprnote" persistent>
      <q-card :class="styp('sm')">
        <q-card-section class="column items-center q-my-md">
          <div class="titre-md text-center text-italic">{{$t('PPsuppn')}}</div>
          <div class="q-mt-sm fs-md font-mono text-bold">{{rec.titre}}</div>
        </q-card-section>
        <q-card-actions align="right"  class="q-gutter-sm">
          <q-btn flat color="primary" dense icon="undo" size="md" padding="xs" 
            :label="$t('renoncer')"  @click="ui.fD"/>
          <q-btn color="warning" dense size="md" icon="delete" padding="xs"
            :label="$t('confirmer')" @click="cfSupprnote" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <q-dialog v-model="ui.d.PPsupprfic" persistent>
      <q-card :class="styp('sm')">
        <q-card-section class="column items-center q-my-md">
          <div class="titre-md text-center text-italic">{{$t('PPsuppf')}}</div>
          <div class="q-mt-sm fs-md font-mono text-bold">{{fic.titre}}</div>
        </q-card-section>
        <q-card-actions align="right" class="q-gutter-sm">
          <q-btn flat color="primary" dense icon="undo" size="md" padding="xs"
            :label="$t('renoncer')" @click="ui.fD"/>
          <q-btn color="warning" dense size="md" icon="delete" padding="xs" 
            :label="$t('confirmer')" @click="cfSupprfic" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    </q-page-container>

  </q-layout>
</q-dialog>
</template>

<script>
import { saveAs } from 'file-saver'
import stores from '../stores/stores.mjs'
import ShowHtml from '../components/ShowHtml.vue'
import { readFile, dhcool, edvol, afficherDiag, dkli, styp } from '../app/util.mjs'
import EditeurMd from '../components/EditeurMd.vue'
import { NLset, NLdel, FLset, FLdel } from '../app/db.mjs'
import NomGenerique from '../components/NomGenerique.vue'
import { interdits, regInt } from '../app/api.mjs'

export default ({
  name: 'PressePapier',

  components: { ShowHtml, EditeurMd, NomGenerique },

  data () {
    return {
      dhcool: dhcool,
      edvol: edvol,
      fileList: null,
      info: '',
      nomfic: '',
      rec: null,
      fic: { nom: '', info: '', lg: 0, type: '', u8: null },
      txt: '',
      interdits: interdits
    }  
  },

  computed: {
    sty () { return this.$q.dark.isActive ? 'sombre' : 'clair' },
    valide () { return this.fic.lg && this.nomfic && this.r1(this.nomfic) === true && this.r1(this.info) === true }
  },

  watch: {
    async fileList (file) {
      if (file) {
        const { size, name, type, u8 } = await readFile(file, true)
        this.fic.nom = name
        this.nomfic = name
        this.fic.info = ''
        this.info = ''
        this.fic.lg = size
        this.fic.type = type
        this.fic.u8 = u8
      }
    }
  },

  methods: {
    r2 (val) { return val.length !== 0 || this.$t('NAe1') },
    r1 (val) { return regInt.test(val) ? this.$t('NAe2') : true },
    ajouternote () {
      this.rec = null
      this.txt = ''
      this.ui.oD('PPnvnote')
    },
    editernote (rec) {
      this.rec = rec
      this.txt = ''
      this.ui.oD('PPnvnote')
    },
    supprn (rec) {
      this.rec = rec
      this.ui.oD('PPsupprnote')
    },
    async cfSupprnote () {
      await NLdel(this.rec.id)
      this.ui.fD()
    },
    async majnote () {
      await NLset(this.txt, this.rec ? this.rec.id : 0)
      this.ui.fD()
    },

    async majfic () {
      const f = this.fic
      await FLset(this.nomfic, this.info, f.type, f.u8, this.fic.id || 0)
      this.ui.fD()
    },
    ajouterfichier () {
      this.fic = { id: 0, nom: '', info: '', lg: 0, type: '', u8: null }
      this.ui.oD('PPnvfic')
    },
    async editerfichier (fic) {
      this.info = fic.info
      this.nomfic = fic.nom
      const u8 = await fic.getU8()
      this.fic = { id: fic.id, nom: fic.nom, info: fic.info, 
        lg: fic.lg, type: fic.type, u8 }
      this.ui.oD('PPnvfic')
    },
    supprfichier (fic) {
      this.fic = fic
      this.ui.oD('PPsupprfic')
    },
    async cfSupprfic () {
      await FLdel(this.fic.id)
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
    const ppSt = stores.pp
    const cfg = stores.config
    const lgmax = cfg.maxlgtextenote

    return {
      dkli, styp,
      session, ppSt, ui,
      lgmax
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
