<template>
  <q-card class="petitelargeur column">
    <q-toolbar class="col-auto bg-primary text-white">
      <q-btn dense size="md" icon="close" @click="MD.fD"/>
      <q-toolbar-title>
        <span class="titre-lg">{{estAvc ? na.nom : na.nomc}}</span> 
        <span v-if="estAvc" class="titre-md q-ml-md">[{{$t('moi')}}]</span>
      </q-toolbar-title>
      <q-btn v-if="ID.estAvatar(na.id) && !estAvc && net" dense size="md" icon="refresh" @click="refresh"/>
    </q-toolbar>

    <div class="row q-pa-xs">
      <img class="col-auto q-mr-sm photomax" :src="photo" />
      <show-html v-if="info" class="col" zoom scroll maxh="6rem" :texte="info"/>
      <div v-else class="col text-italic">{{$t('FAnoinfo')}}</div>
    </div>

  </q-card>
</template>

<script>
import { toRef } from 'vue'
import stores from '../stores/stores.mjs'
import ShowHtml from './ShowHtml.vue'
import { MD } from '../app/modele.mjs'
import { ChargerCvs } from '../app/operations.mjs'
import { ID } from '../app/api.mjs'

export default {
  name: 'ApercuCv',

  props: { 
    na: Object, cv: Object
  },

  components: { ShowHtml },

  computed: {
    lidk () { return !this.$q.dark.isActive ? 'sombre0' : 'clair0' },
    photo () { return this.cv && this.cv.photo ? this.cv.photo : this.na.defIcon },
    info () { return this.cv ? (this.cv.info || '') : '' }
  },

  data () {
    return {
    }
  },

  methods: {
    async refresh () {
      await new ChargerCvs().run(na.id)
    }
  },

  setup (props) {
    const aSt = stores.avatar
    const session = stores.session
    const na = toRef(props, 'na')
    const estAvc = aSt.compte.estAvDuCompte(na.value.id)

    return {
      session, MD, ID, aSt, estAvc,
      net: session.accesNet
    }
  }
}
</script>
<style lang="sass" scoped>
@import '../css/app.sass'
.bord
  border-top: 1px solid $grey-5
.q-btn
  padding: 1px !important
</style>
