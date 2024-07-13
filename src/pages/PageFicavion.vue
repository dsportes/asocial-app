<template>
<q-page>
  
  <div v-if="lst.length === 0" class="titre-lg text-italic">{{$t('FAVnone')}}</div>

  <div v-else v-for="(x, idx) in lst" :key="x.fa.id" 
    :class="dkli(idx) + ' q-mb-sm'">
    <q-card class="q-mx-xs">

      <div class="text-italic">{{x.titre}}</div>

      <div class="row justify-between q-gutter-sm">
        <div class="col row q-gutter-xs">
          <span class="font-mono text-bold">{{x.fa.nom}}</span>
          <span v-if="x.f.info" class="font-mono">{{x.f.info}}</span>
          <span>{{x.f.type}}</span>
          <span>{{edvol(x.f.lg)}}</span>
        </div>
        <menu-fichier :idf="x.fa.id" class="col-auto self-start"
          simple :note="x.n"/>
      </div>

      <div v-if="x.fa.dhdc === 0" class="titre-md">{{$t('DFchgdl')}}</div>

      <div v-else>
        <div class="titre-md">
          <span>{{$t('DFchgdem', [dhcool(x.fa.dhdc, true)])}}</span>
          <span v-if="x.fa.nbr" class="q-ml-sm">- {{$t('DFretry', [x.fa.nbr])}}</span>
          <span v-if="!x.fa.exc">
            <span v-if="x.fa.id === faSt.idfdl" class="q-ml-sm">- {{$t('DFchgec')}}</span>
            <span v-else class="q-ml-sm">- {{$t('DFchgatt')}}</span>
          </span>
        </div>
        <div v-if="x.fa.exc">
          <div class="titre-md msg">
            {{$t('DFerr', [x.fa.exc[0] === 404 ? $t('ER404') : '' + x.fa.exc[0]])}}
          </div>
          <div class="q-my-xs q-ml-md font-mono fs-sm">
            {{$t('DFerr2', [x.fa.exc[0] === 404 ? fa.exc[1] : $t('EX' + x.fa.exc[0])])}}
          </div>
          <div class="titre-md text-italic text-bold">
            {{$t(x.fa.nbr < 3 ? 'DFretaut' : 'DFnoret')}}
          </div>
          <div v-if="session.synchro" class="q-my-sm text-right">
            <btn-cond :label="$t('retry')" @ok="retry(x.fa.id)"/>
          </div>
        </div>
      </div>
    </q-card>
    <q-separator class="q-my-xs"/>
  </div>

</q-page>
</template>

<script>
import stores from '../stores/stores.mjs'
import { edvol, dhcool, dkli, styp } from '../app/util.mjs'
import MenuFichier from '../components/MenuFichier.vue'
import BtnCond from '../components/BtnCond.vue'
// import BoutonHelp from '../components/BoutonHelp.vue'
import { idb } from '../app/db.mjs'

export default ({
  name: 'PageFicavion',

  components: { MenuFichier, BtnCond },

  computed: {
    lst () {
      const l = []
      for (const [idf, fa] of this.faSt.map) {
        const n = this.nSt.getNote(fa.ref[0], fa.ref[1])
        if (!n) continue
        const titre = n ? n.titre : '?'
        const f = n.mfa.get(fa.id)
        l.push({fa, n, f, titre})
      }
      l.sort((a, b) => {
        return a.fa.lg > b.fa.lg ? -1 : (a.fa.lg < b.fa.lg ? 1 : 0)
      })
      return l
    }
  },

  data () {
    return {
    }
  },

  methods: {
    async retry (idf) {
      await this.faSt.retry(idf)
    },
  },

  setup () {
    const faSt = stores.ficav
    const nSt = stores.note
    const session = stores.session
    const ui = stores.ui

    return {
      edvol, dhcool, dkli, styp,
      nSt, faSt, session, ui
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
