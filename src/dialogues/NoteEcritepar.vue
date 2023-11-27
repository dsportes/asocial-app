<template>
<div>
  <div v-if="la.length === 1" class="titre-lg">{{$t('PNOaut1', [naAut.nom])}}</div>
  <div v-else class="titre-md">
    <q-btn no-caps flat :label="$t('PNOaut1', [naAut.nom])" icon-right="expand_more">
      <q-menu anchor="bottom left" self="top left" max-height="10rem" 
        max-width="20rem">
        <q-list class="bg-secondary text-white">
          <q-item v-for="na in la" :key="na.id" clickable 
            v-close-popup @click="selNa(na)">
            <span class="fs-md">{{na.nom}}</span>
          </q-item>
        </q-list>
      </q-menu>
    </q-btn>
  </div>
</div>
</template>

<script>
import { ref } from 'vue'
import stores from '../stores/stores.mjs'

export default {
  name: 'NoteEcritepar',

  components: { },

  computed: { },

  methods: { },

  data () {
    return {
    }
  },

  setup (props, context) {
    const aSt = stores.avatar
    const la = ref(aSt.naAvatars)
    const naAut = ref(la.value[0])
    function selNa(na) {
      context.emit('ok', na)
    }
    selNa(naAut.value)
    return {
      naAut, aSt, selNa, la
    }
  }

}
</script>

<style lang="sass" scoped>
@import '../css/app.sass'
</style>
