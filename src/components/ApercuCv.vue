<template>
  <div :class="'petitelargeur column ' + lidk">
    <q-toolbar class="col-auto">
      <q-btn dense size="md" icon="close" @click="MD.fD"/>
      <q-space/>
      <q-btn v-if="!estAvc && net" dense size="md" icon="refresh" @click="refresh"/>
      <q-btn v-if="!estAvc" dense size="md" icon="more_horiz" @click="ouvrirdetails"/>
    </q-toolbar>

    <div class="col-auto row q-pa-xs">
      <div class="col-auto items-center q-mr-sm">
        <img class="photomax" :src="photo" />
      </div>
      <div class="col column justify-center">
        <div class="text-bold text-center">
          <span class="titre-lg">{{estAvc ? na.nom : na.nomc}}</span> 
          <span v-if="estAvc" class="titre-md q-ml-md">[{{$t('moi')}}]</span>
        </div>
        <div class="fs-sm font-mono q-mt-xs text-center">#{{na.id}}</div> 
      </div>
    </div>

    <show-html v-if="info" class="col q-ma-xs bord" maxh="6rem" :idx="-1" :texte="info"/>
    <div v-else class="col q-ma-xs text-italic titre-md">{{$t('FAnocv')}}</div>

  </div>
</template>

<script>
import { ref, toRef } from 'vue'
import stores from '../stores/stores.mjs'
import ShowHtml from './ShowHtml.vue'
import { MD, getNg } from '../app/modele.mjs'
import { ChargerCvs } from '../app/operations.mjs'

export default {
  name: 'ApercuCv',

  props: { 
    id: Number
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
    ouvrirdetails () {
      this.session.setPeopleId(this.na.id)
      MD.oD('detailspeople')
    }
  },

  setup (props) {
    const aSt = stores.avatar
    const pSt = stores.people
    const session = stores.session
    const id = toRef(props, 'id')
    const na = getNg(id.value)
    const avatar = aSt.getAvatar(id.value)
    const estAvc = avatar !== null
    const cv = ref(null)

    async function refresh () {
      const x = await new ChargerCvs().run(id.value)
      if (x) initCv()
    }

    function initCv () {
      cv.value = estAvc ? avatar.cv : pSt.getCv(id.value)
    }

    initCv()
    
    return {
      session, MD, cv, na, estAvc, refresh,
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
