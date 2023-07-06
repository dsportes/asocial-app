<template>
<div class="bs" style="width:80vw">
<q-layout container view="hHh lpR fFf">
  <q-header elevated class="bg-secondary text-white">
    <q-toolbar>
      <q-btn dense size="md" color="warning" icon="close" @click="MD.fD"/>
      <q-toolbar-title v-if="avid!==0" class="titre-lg full-width text-center">{{$t('SAVtit', [na.nom])}}</q-toolbar-title>
      <q-toolbar-title v-else class="titre-lg full-width text-center text-bold bg-yellow-5 text-negative">
        {{$t('SAVtit2', [na.nom])}}</q-toolbar-title>
      <bouton-help page="page1"/>
    </q-toolbar>
  </q-header>

  <q-page-container>
    <q-page :class="dkli">

    </q-page>
  </q-page-container>
</q-layout>
</div>
</template>

<script>
import { ref, toRef, reactive } from 'vue'
import { MD, getNg } from '../app/modele.mjs'
import stores from '../stores/stores.mjs'
import BoutonHelp from '../components/BoutonHelp.vue'
import { edvol } from '../app/util.mjs'

export default ({
  name: 'SupprAvatar',

  props: { avid: Number },

  components: { BoutonHelp },

  computed: {
    dkli () { return this.$q.dark.isActive ? 'sombre' : 'clair' }
  },

  data () {
    return {
    }
  },

  watch: {
  },

  methods: {
  },

  setup (props) {
    const session = stores.session
    const avid = toRef(props, 'avid')
    const na = ref(getNg(avid.value ? avid.value : session.compteId))
    const aSt = stores.avatar
    const nSt = stores.note
    const gSt = stores.groupe

    const s = reactive( { 
      stats: {}, // map des nbn notes, v1 v2 par avatar et groupe
      ch: [], // liste des chats
      gr: [], // liste des groupes
      sp: [], // liste des sponsorings
      v1g: 0, // v1 total des groupes hébérgés
      v2g: 0, // v2 total des groupes hébérgés
      v1n: 0, // v1 total des notes de l'avatar
      v2n: 0, // v2 total des notes de l'avatar
      nbn: 0  // nbre total des notes de l'avatar
    } )

    function init () {
      const id = na.value.id
      s.v1g = 0; s.v2g = 0
      s.stats = nSt.statsParRacine
      const a = s.stats[id]
      s.v1n = a.v1; s.v2n = a.v2; s.nbn = a.n
      const e = aSt.getElt(id)
      s.ch = Array.from(e.chats.values())
      s.sp = Array.from(e.sponsorings.values())
      const gr = []
      e.grIds.forEach(idg => {
        const egr = gSt.egr(idg)
        const x = {}
        x.gr = egr.groupe
        x.mb = gSt.membreDeId(egr, id)
        if (x.gr.imh === x.mb.ids) { 
          x.heb = true; x.v1 = egr.objv.vols.v1; x.v2 = egr.objv.vols.v2
          s.v1g += x.v1; s.v2g += x.v2
        }
        const y = gSt.animIds(egr); if (y.size === 1 && y.has(id)) x.dan = true
        const z = gSt.actifIds(egr); if (z.size === 1 && z.has(id)) x.dac = true
        x.nbn = s.stats[idg].n
        x.st = x.dac ? 1 : (x.heb ? 2 : (x.dan ? 3 : 0))
        gr.push(x)
      })
      s.gr = gr
    }

    nSt.$onAction(({ name, args, after }) => {
      after((result) => {
        if (name === 'setNote' || name === 'delNote') init()
      })
    })

    const names1 = new Set(['setCompte', 'setAvatar', 'setChat', 'setSponsoring', 'del'])
    aSt.$onAction(({ name, args, after }) => {
      after((result) => {
        if (names1.has(name)) init()
      })
    })

    const names2 = new Set(['setGroupe', 'setMembre', 'delGroupe', 'delMembre'])
    gSt.$onAction(({ name, args, after }) => {
      after((result) => {
        if (names2.has(name)) init()
      })
    })

    init()
    return {
      session,
      MD, edvol, aSt, na, s
    }
  }
})
</script>

<style lang="sass" scoped>
@import '../css/app.sass'
.q-toolbar
  padding: 0 !important
  min-height: 0 !important
.q-btn
  padding: 0 !important
</style>
