<template>
  <q-layout container view="hHh lpR fFf" :class="sty" style="width:80vw">
    <q-header elevated class="bg-secondary text-white">
      <q-toolbar>
        <q-btn dense color="warning" size="md" icon="close" @click="gotoListe"/>
        <q-btn v-if="!lst.estVide" :disable="!lst.aPrecedent" flat round dense icon="first_page" size="sm" @click="lst.premier()" />
        <q-btn v-if="!lst.estVide" :disable="!lst.aPrecedent" flat round dense icon="arrow_back_ios" size="sm" @click="lst.precedent()" />
        <span v-if="!lst.estVide" class="fs-sm">{{lst.idx + 1}}/{{lst.liste.length}}</span>
        <q-btn v-if="!lst.estVide" :disable="!lst.aSuivant" flat round dense icon="arrow_forward_ios" size="sm" @click="lst.suivant()" />
        <q-btn v-if="!lst.estVide" :disable="!lst.aSuivant" flat round dense icon="last_page" size="sm" @click="lst.dernier()" />
        <q-toolbar-title class="titre-lg full-width text-right">
          <div class="q-mr-sm">{{lst.estVide ? $t('PTvide') : $t('PTtit', [state.t.na.nom])}}</div>
        </q-toolbar-title>
      </q-toolbar>
    </q-header>

    <q-page-container v-if="!lst.estVide" class="q-pa-sm">
      <div v-if="session.estComptable" class="q-mt-md row justify-around q-gutter-xs">
        <q-btn dense color="secondary" :label="$t('PTpnc')" size="md"
          text-color="white" @click="nvpar = true"/>
        <q-btn dense color="secondary" :label="$t('PTtrf')" size="md"
          text-color="white" @click="transf = true"/>
      </div>

      <q-separator v-if="session.estComptable" class="q-mt-sm"/>

      <div class="row justify-between items-center q-my-md">
        <div class="titre-md">{{$t('comptes', state.t.nbc, { count: state.t.nbc })}} - {{$t('parrains', state.lp.length, { count: state.lp.length })}}</div>
        <q-btn flat dense size="md" icon="chevron_right" :disable="state.lp.length===0" @click="ouvlp=true"/>
      </div>

      <q-dialog v-model="ouvlp" full-height position="right">
        <q-card class="petitelargeur">
          <q-toolbar class="bg-secondary text-white">
            <q-toolbar-title>
              <span class="q-ml-sm titre-lg">{{$t('PTptr', state.lp.length) + ' ' + state.t.na.nom }}</span>
            </q-toolbar-title>
            <q-btn dense size="md" color="warning" icon="chevron_right" @click="ouvlp=false"/>
          </q-toolbar>
          <div v-for="(nap, idx) in state.lp" :key="nap.id">
            <fiche-people class="q-my-lg" :people="peoplede(nap.id)" :idx="idx"/>
          </div>
        </q-card>
      </q-dialog>

      <div class="titre-md q-my-md">{{$t('PTci')}}</div>
      <editeur-md :texte="state.t.info" v-model="info" @ok="changerInfo"
        label-ok="valider" :editable="session.estComptable" :modetxt="session.estComptable" style="height:8rem"/>

        <q-bar class="fullwidth q-mt-md">
          <q-icon v-if="bloc===0" class="q-pa-xs" size="md" name="check" color="green-5"/>
          <q-icon v-if="bloc===1" class="q-pa-xs" size="md" name="notification_important" color="warning"/>
          <q-icon v-if="bloc===2" class="q-pa-xs" size="md" name="fullscreen_exit" color="warning"/>
          <q-icon v-if="bloc===3" class="q-pa-xs" size="md" name="edit_off" color="negative"/>
          <q-icon v-if="bloc===4" class="q-pa-xs" size="md" name="lock_outline" color="negative"/>
          <div class="titre-md">{{$t('IB'+bloc)}}</div>
          <q-space/>
          <q-btn dense color="primary" icon="chevron_right" @click="openEdBl"/>
        </q-bar>

      <div class="q-mt-md titre-lg">{{$t('PTvat')}}</div>
      <div>
        <span class=q-mx-md>V1: {{ed1(state.t.f1)}}</span>
        <span>V2: {{ed2(state.t.f2)}}</span>
      </div>
      <div class="q-mt-md titre-lg">{{$t('PTres')}}</div>
      <choix-forfaits v-model="reserves" @valider="changerRes" :label-valider="session.estComptable ? 'changer' : ''"
        :max="99999" :f1="state.t.r1" :f2="state.t.r2" :lecture="!session.estComptable" />
    </q-page-container>

  <q-dialog v-model="editBl" persistent class="moyennelargeur" full-height position="right">
    <ed-blocage class="q-my-md" :source="state.t" :na-tribu="state.t.na"
      :lecture="!session.estComptable" :close="closeEdBl"/>
  </q-dialog>

  <q-dialog v-model="nvpar" persistent class="moyennelargeur">
    <nouveau-parrainage :close="fermerParrain" :naTribu="state.t.na"/>
  </q-dialog>

  <q-dialog v-model="transf" persistent class="moyennelargeur">
    <changer-tribu :close="fermerTransf" :tribu="tribu"/>
  </q-dialog>

  </q-layout>
</template>
<script>
import { reactive, onMounted } from 'vue'
import { UNITEV1, UNITEV2 } from '../app/api.mjs'
import { edvol } from '../app/util.mjs'
import { setNg, NomAvatar } from '../app/modele.mjs'
import { InforesTribu, GetCVs } from '../app/operations.mjs'
import ChoixForfaits from '../components/ChoixForfaits.vue'
import EditeurMd from '../components/EditeurMd.vue'
import FichePeople from '../components/FichePeople.vue'
import NouveauParrainage from './NouveauParrainage.vue'
import ChangerTribu from './ChangerTribu.vue'
import EdBlocage from '../components/EdBlocage.vue'
import stores from '../stores/stores.mjs'

export default ({
  name: 'PanelTribu',

  components: { EdBlocage, ChangerTribu, FichePeople, ChoixForfaits, NouveauParrainage, EditeurMd },

  props: { close: Function },

  computed: {
    sty () { return this.$q.dark.isActive ? 'sombre' : 'clair' },
    bloc () { return this.state.t.blocage ? this.state.t.blocage.st : 0 }
  },

  data () {
    return {
      editBl: false,
      nvpar: false,
      ouvlp: false,
      transf: false,
      info: '',
      reserves: [0, 0]
    }
  },

  methods: {
    gotoListe () { if (this.close) this.close() },
    peoplede (id) { return stores.people.getPeople(id) },

    openEdBl () { this.editBl = true },
    closeEdBl () { this.editBl = false },

    dkli (idx) { return this.$q.dark.isActive ? (idx ? 'sombre' + (idx % 2) : 'sombre0') : (idx ? 'clair' + (idx % 2) : 'clair0') },
    ed1 (f) { return edvol(f * UNITEV1) },
    ed2 (f) { return edvol(f * UNITEV2) },
    ed3 (f) { return edvol(f) },
    fermerParrain () { this.nvpar = false },
    fermerTransf () { this.transf = false },
    fermertribu () { if (this.close) this.close() },

    async changerInfo (info) {
      await new InforesTribu().run(this.state.t, info, null)
    },
    async changerRes () {
      await new InforesTribu().run(this.state.t, null, this.reserves)
    }
  },

  setup (props) {
    const lst = stores.listeTribus

    const state = reactive({
      t: lst.courante, // IL FAUT une valeur AVANT que onMounted s'exécute
      lp: []
    })

    async function initState () {
      state.t = lst.courante
      const x = state.t && state.t.mncp ? Object.values(state.t.mncp) : []
      state.lp = []
      x.forEach(y => {
        const na = new NomAvatar(y[0], y[1])
        state.lp.push(na)
        setNg(na)
      })
      const lids = new Set()
      state.lp.forEach(na => { lids.add(na.id) })
      if (lids.size) await new GetCVs().run(lids)
    }

    onMounted(async () => {
      await initState()
    })

    lst.$onAction(({ name, args, after }) => {
      after(async (result) => {
        await initState()
      })
    })

    return {
      state,
      lst,
      session: stores.session
    }
  }
})
</script>
<style lang="sass" scoped>
@import '../css/app.sass'
.bord1
  border:  1px solid $grey-5
.q-toolbar
  padding: 2px !important
  min-height: 0 !important
.q-bar--standard
  padding: 0 !important
  height: 2.5rem !important
$haut: 3.5rem
.top
  position: absolute
  top: 0
  left: 0
  height: $haut
  overflow: hidden
  z-index: 2
.filler
  height: $haut
  width: 100%
</style>
