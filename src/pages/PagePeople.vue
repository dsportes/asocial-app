<template>
  <q-page class="column q-pl-xs q-mr-sm largeur40 maauto">
    <div v-if="session.filtreMsg" class="msg q-pa-xs fs-sm text-bold font-mono bg-yellow text-warning">{{session.filtreMsg}}</div>

    <q-card v-if="session.accesNet" class="q-my-md q-pa-xs row justify-center">
      <q-btn class="q-my-sm" size="md" no-caps dense color="primary" 
        :label="$t('CVraf')" @click="rafCvs"/>
    </q-card>

    <div v-if="pSt.peLp && !pSt.peLpF" class="q-my-md titre-lg text-italic">
      {{$t('APnb', [pSt.peLp.length])}}
    </div>
    
    <div v-if="pSt.peLpF.length">
      <q-card class="q-my-md" v-for="(p, idx) in pSt.peLpF" :key="p.id">
        <apercu-people class="q-pa-xs" :id="p.na.id" :idx="idx"/>
      </q-card>
    </div>
  </q-page>
</template>

<script>
import stores from '../stores/stores.mjs'
import ApercuPeople from '../components/ApercuPeople.vue'
import { RafraichirCvs } from '../app/operations.mjs'

export default {
  name: 'PagePeople',

  components: { ApercuPeople },

  computed: {
  },

  methods: {
    async rafCvs () {
      const [nt, nr] = await new RafraichirCvs().run(0)
      stores.ui.afficherMessage(this.$t('CVraf2', [nr, nt - nr]), false)
    }
  },

  data () {
    return {
    }
  },

  setup () {
    const pSt = stores.people
    const session = stores.session

    return {
      ui: stores.ui,
      session,
      pSt
    }
  }

}
</script>

<style lang="sass" scoped>
@import '../css/app.sass'
.msg
  position: absolute
  z-index: 99999
  top: -20px
  right: 5px
  border-radius: 5px
  border: 1px solid black
</style>
