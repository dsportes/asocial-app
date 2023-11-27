<template>
<div :class="dkli(0) + ' bs dp50'">
<q-layout container view="hHh lpR fFf">
  <q-header elevated class="bg-secondary text-white">
    <q-toolbar>
      <q-btn dense size="md" color="warning" icon="close" @click="MD.fD"/>
      <q-toolbar-title class="titre-lg full-width text-center">
        {{$t('PNOextit', [groupe.na.nomc])}}
      </q-toolbar-title>
      <bouton-help page="page1"/>
    </q-toolbar>
    <q-toolbar v-if="session.editDiag" inset class="full-width bg-secondary text-white">
      <div class='q-ma-sm q-pa-sm text-center text-bold titre-md bg-yellow-5 text-warning'>
        {{session.editDiag}}
      </div>
    </q-toolbar>
  </q-header>

  <q-page-container >
    <q-page class="q-pa-xs">
      <liste-auts class="q-my-sm"/>

      <div v-if="xav">
        <div class="text-italic titre-md text-bold">{{$t('PNOext2')}}</div>
        <apercu-genx v-if="xav.na" class="q-my-md" 
          :na="xav.na" :ids="xav.im" :cv="cv(xav)" :estAvc="xav.avc"/>
        <div v-else class="titre-md text-bold">{{xav.nom}}</div>
        <q-btn v-if="xav.avc" dense size="sm" color="primary" icon="close" 
          :label="$t('PNOperdre1')" @click="perdre"/>
        <q-btn v-if="!xav.avc && gSt.estAnim" dense size="sm" color="primary" icon="close" 
          :label="$t('PNOperdre2')" @click="perdre"/>
      </div>
      <div v-else class="text-italic titre-md text-bold">{{$t('PNOext1')}}</div>


      <div v-if="!amb" class="q-my-md q-pa-xs text-bold text-negative bg-yellow-5">
        {{$t('PNOamb')}}</div>

      <div v-else>
        <div v-if="!xav && !estAnim" class="q-my-md q-pa-xs text-bold text-negative bg-yellow-5">
        {{$t('PNOexaut')}}</div>

        <div v-else>
          <div class="q-mt-md titre-lg text-italic text-center">{{$t('PNOlex')}}</div>
          <div class="sp30 q-mt-sm scroll" style="max-height:40vh">
            <div v-for="(e, idx) in lst" :key="idx" 
              :class="dkli(idx) + ' q-mt-xs row cursor-pointer bord' + (xap && (e.im === xap.im) ? '2' : '1')"
              @click="selmb(e)">
              <div class="col-2 text-center">#{{e.im}}</div>
              <div class="col-10">{{e.nom}}</div>
            </div>
          </div>

          <q-separator color="orange" class="q-my-sm"/>

          <div class="row items-center justify-around">
            <q-btn size="md" dense color="primary" :label="$t('renoncer')" @click="MD.fD"/>
            <q-btn size="md" dense color="warning" :disable="!xap"
              :label="$t('PNOex')" @click="valider"/>
          </div>

          <!--   props: { 
          na: Object, // na de la persone (people, avatar) ou du groupe 
          ids: Number, // pour un "membre" ids (indice) du membre à afficher
          cv: Object, // carte de visite
          estAvc: Boolean, // true si c'est un avatar du compte
          cvchangee: Function, // fonction d'enregistrement de la CV quand elle a été éditée
          detailPeople: Boolean, // bouton d'affichage du détail du people
          idx: Number
          -->
          <apercu-genx v-if="xap" class="q-my-md" :na="xap.na" :ids="xap.im" :cv="xap.cv" :estAvc="xap.avc"/>
        </div>
      </div>

    </q-page>
  </q-page-container>
</q-layout>
</div>
</template>

<script>
import { ref } from 'vue'
import stores from '../stores/stores.mjs'
import { MD } from '../app/modele.mjs'
import { $t, dkli } from '../app/util.mjs'
import BoutonHelp from '../components/BoutonHelp.vue'
import ApercuGenx from '../components/ApercuGenx.vue'
import ListeAuts from '../components/ListeAuts.vue'
import { ExcluNote } from '../app/operations.mjs'

export default {
  name: 'NoteExclu',

  components: { BoutonHelp, ApercuGenx, ListeAuts },

  props: { },

  computed: {
    amb () { return this.aSt.compte.ambano(this.groupe)[0] },
    estAnim () { return this.gSt.egr(this.idg).estAnim }
  },

  watch: {
  },

  methods: {
    selmb (e) {
      e.cv = this.cv(e)
      this.xap = e
    },
    async valider () {
      const n = this.nSt.note
      await new ExcluNote().run(n.id, n.ids, this.xap.im)
    },
    async perdre () {
      const n = this.nSt.note
      await new ExcluNote().run(n.id, n.ids, 0)
    }
  },

  data () {
    return {
    }
  },

  setup () {
    const session = stores.session
    const nSt = stores.note
    const gSt = stores.groupe
    const aSt = stores.avatar
    const cpt = aSt.compte
    const pSt = stores.people
    const idg = nSt.note.id

    function cv(x) {
      return !x.avc ? pSt.getCv(x.na.id) : aSt.getAvatar(x.na.id).cv
    }

    const xav = ref() // exclu actuel
    const xap = ref() // exclu futur
    const groupe = ref(gSt.egr(idg).groupe)

    const lst = ref([])

    function init() {
      xap.value = null
      xav.value = nSt.mbExclu
      // {im: m.ids, na: m.na }
      const lx = []
      const l = gSt.nexLm(idg)
      l.forEach(e => {
        if (e.im !== nSt.note.im) {
          const x = { ...e }
          x.avc = cpt.estAvDuCompte(x.na.id)
          x.nom = x.avc ? $t('moi2', [ x.na.nom]) : x.na.nomc
          lx.push(x)
        }
      })
      lx.sort((a,b) => {
        if (a.avc && b.avc) return (a.nom < b.nom ? -1 : 1)
        if (a.avc) return -1
        if (b.avc) return 1
        return (a.nom < b.nom ? -1 : (a.nom === b.nom ? 1 : 0))
      })
      lst.value = lx
    }

    nSt.$onAction(({ name, args, after }) => {
      after((result) => {
        if (name === 'setNote' && args[0].id === idg) {
          init()
        }
      })
    })

    init()

    return {
      session, nSt, gSt, pSt, aSt, cv, idg,
      groupe, lst, xav, xap,
      MD, dkli
    }
  }

}
</script>

<style lang="sass" scoped>
@import '../css/app.sass'
.bord1
  border: 2px solid transparent
.bord2
  border: 2px solid $warning
</style>
