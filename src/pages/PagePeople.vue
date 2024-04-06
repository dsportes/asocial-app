<template>
  <q-page class="column q-pl-xs q-mr-sm spmd">
    <q-card v-if="session.accesNet" class="q-my-md q-pa-xs row justify-center">
      <btn-cond class="q-my-sm" 
        :cond="session.estAdmin ? 'cUrgence' : 'cVisu'"
        :label="$t('CVraf')" @ok="rafCvs"/>
    </q-card>

    <div v-if="pSt.peLp && !pSt.peLpF" class="q-my-md titre-lg text-italic">
      {{$t('APnb', [pSt.peLp.length])}}
    </div>
    
    <div v-if="pSt.peLpF.length">
      <q-card class="q-my-md" v-for="(p, idx) in pSt.peLpF" :key="p.id">
        <apercu-genx class="q-pa-xs" :id="p.id" :idx="idx"/>
      </q-card>
    </div>
  </q-page>
</template>

<script>
import stores from '../stores/stores.mjs'
import ApercuGenx from '../components/ApercuGenx.vue'
import BtnCond from '../components/BtnCond.vue'
import { RafraichirCvsAv } from '../app/operations4.mjs'

export default {
  name: 'PagePeople',

  components: { ApercuGenx, BtnCond },

  computed: {
  },

  methods: {
    async rafCvs () {
      let nc = 0, nv = 0
      for (const id of this.session.compte.mav) {
        const [x, y] = await new RafraichirCvsAv().run(id)
        nc += x; nv += y
      }
      stores.ui.afficherMessage(this.$t('CVraf2', [nc, nv]), false)
    }
  },

  data () {
    return {
    }
  },

  setup () {
    return {
      ui: stores.ui,
      session: stores.session,
      pSt: stores.people
    }
  }

}
</script>

<style lang="sass" scoped>
@import '../css/app.sass'
</style>
