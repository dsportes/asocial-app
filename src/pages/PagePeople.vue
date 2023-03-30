<template>
  <q-page class="q-pa-sm">
    <div v-if="session.filtreMsg" class="msg q-pa-xs fs-sm text-bold font-mono bg-yellow text-warning">{{session.filtreMsg}}</div>

    <q-btn v-if="session.accesNet" class="q-my-sm" size="md" no-caps dense color="primary" 
      :label="$t('CVraf')" @click="rafCvs"/>

    <div v-if="pStore.peLp && !pStore.peLpF" class="titre-lg text-italic">
      {{$t('APnb', [pStore.peLp.length])}}
    </div>
    
    <div v-if="pStore.peLpF.length">
      <div v-for="(p, idx) in pStore.peLpF" :key="p.id">
        <apercu-people class="q-my-sm" :id="p.na.id" :idx="idx"/>
      </div>
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
    const pStore = stores.people
    const session = stores.session

    return {
      ui: stores.ui,
      session,
      pStore
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
