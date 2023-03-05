<template>
  <div :class="'col items-start ' + dkli(idx)">
    <div>
      <span class="text-bold fs-md q-mr-sm">{{t.na.nom}}</span> 
      <span class="text-bold fs-sm font-mono q-mr-sm">#{{id}}</span> 
    </div>
    <show-html v-if="t.info" class="q-my-xs bord" :idx="idx" 
      zoom maxh="3rem" :texte="t.info"/>
    <div v-else class="text-italic">{{$t('PTnoinfo')}}</div>
    <div>{{t.a1}} - {{t.a2}} / {{t.r1}} - {{t.r2}}</div>
  </div>
</template>
<script>

import { toRef, ref } from 'vue'

import stores from '../stores/stores.mjs'
import ShowHtml from './ShowHtml.vue'
import { IDCOMPTABLE } from '../app/api.mjs'

export default {
  name: 'ApercuTribu',

  props: { id: Number, idx: Number },

  components: { ShowHtml },

  computed: { },

  data () { return {
  }},

  methods: {
    dkli (idx) { return this.$q.dark.isActive ? (idx ? 'sombre' + (idx % 2) : 'sombre0') : (idx ? 'clair' + (idx % 2) : 'clair0') },
  },

  setup (props) {
    const avStore = stores.avatar
    const id = toRef(props, 'id')

    function getT () {
      const t = avStore.getTribu(id.value)
      return t
    }

    const t = ref(getT())
    avStore.$onAction(({ name, args, after }) => {
      after((result) => {
        if ((name === 'setTribuC' || name === 'setTribu') && args[0].id === id.value) {
          t.value = getT()
        }
      })
    })

    return {
      t
    }
  }
}
</script>
<style lang="sass" scoped>
@import '../css/app.sass'
</style>
