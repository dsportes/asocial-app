<template>
  <q-page class="column q-pl-xs q-mr-sm largeur40 maauto">
    <q-card v-if="session.accesNet" class="q-my-md q-pa-xs row justify-center">
      <q-btn class="q-my-sm" size="md" no-caps dense color="primary" 
        :label="$t('CVraf')" @click="rafCvs"/>
    </q-card>

    <div v-if="pSt.peLp && !pSt.peLpF" class="q-my-md titre-lg text-italic">
      {{$t('APnb', [pSt.peLp.length])}}
    </div>
    
    <div v-if="pSt.peLpF.length">
      <q-card class="q-my-md" v-for="(p, idx) in pSt.peLpF" :key="p.id">
        <apercu-genx class="q-pa-xs" :id="p.na.id" :idx="idx"/>
      </q-card>
    </div>
  </q-page>
</template>

<script>
import { ref } from 'vue'
import stores from '../stores/stores.mjs'
import ApercuGenx from '../components/ApercuGenx.vue'
import { RafraichirCvs } from '../app/operations.mjs'
import { Motscles } from '../app/modele.mjs'

export default {
  name: 'PagePeople',

  components: { ApercuGenx },

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
    const fStore = stores.filtre

    const mapmc = ref(Motscles.mapMC(true, 0))
    fStore.setContexte('people', { mapmc: mapmc.value, groupeId : 0})

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
