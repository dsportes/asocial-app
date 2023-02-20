<template>
  <div :class="'row items-start ' + dkli(idx)">
    <div class="col-auto q-mr-sm">
      <img class="photomax" :src="p.photo" />
    </div>
    <div class="col">
      <div>
        <span class="text-bold fs-md q-mr-sm">{{p.na.nomc}}</span> 
        <span class="text-bold fs-sm font-mono q-mr-sm">#{{id}}</span> 
      </div>
      <show-html v-if="p.info" class="q-my-xs bord" :idx="idx" 
        zoom maxh="3rem" :texte="p.info"/>
      <div v-else class="text-italic">{{$t('FAnocv')}}</div>
    </div>
  </div>
</template>
<script>

import { toRef, ref } from 'vue'

import stores from '../stores/stores.mjs'
import ShowHtml from './ShowHtml.vue'

export default {
  name: 'ApercuPeople',

  props: { id: Number, idx: Number },

  components: { ShowHtml },

  computed: { },

  data () { return {
  }},

  methods: {
    dkli (idx) { return this.$q.dark.isActive ? (idx ? 'sombre' + (idx % 2) : 'sombre0') : (idx ? 'clair' + (idx % 2) : 'clair0') },
  },

  setup (props) {
    const pStore = stores.people
    const config = stores.config
    const id = toRef(props, 'id')
    const phDef = (id.value === IDCOMPTABLE ? config.iconSuperman : config.iconAvtar)

    function getP () {
      const p = pStore.getPeople(id.value)
      p.info = p.cv ? (p.cv.info || '') : ''
      p.photo = p.cv ? (p.cv.photo || phDef) : phDef
      return p
    }

    const p = ref(getP())
    pStore.$onAction(({ name, args, after }) => {
      after((result) => {
        if (name === 'getElt' && args[0] === id.value) {
          p.value = getP()
        }
      })
    })

    return {
      p
    }
  }
}
</script>
<style lang="sass" scoped>
@import '../css/app.sass'
</style>
