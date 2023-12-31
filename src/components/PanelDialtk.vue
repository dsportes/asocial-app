<template>
  <q-card :class="styp('sm')">
    <q-card-section>
      <div class="q-pa-md titre-lg text-center">{{$t(titre)}}</div>

      <div class="row items-center">
        <div class="lg0 text-italic titre-md q-mr-lg">{{$t('TKmnt')}}</div>
        <q-input class="lg1" dense v-model="mx" mask="#,##" fill-mask="0" 
          suffix="€" clearable placeholder="3,50" reverse-fill-mask/>
      </div>
      <div class="text-negative mh">{{diag}}</div>

      <div class="row items-center">
        <div class="lg0 text-italic titre-md q-mr-lg">{{$t('TKrefx')}}</div>
        <q-input class="lg2" dense v-model="refx" clearable counter maxlength="20">
          <template v-slot:hint>{{$t('TKrefh')}}</template>
        </q-input>
      </div>

    </q-card-section>
    <q-card-actions align="right" class="q-gutter-sm">
      <q-btn flat dense padding="xs" size="md" color="primary" icon="undo"
        :label="$t('renoncer')" @click="ui.fD"/>
      <q-btn dense padding="xs" size="md" color="warning" icon="check"
        :label="$t('TKgen')" :disable="diag !== ''" @click="generer"/>
    </q-card-actions>
  </q-card>
</template>

<script>
import { toRef, ref, watch } from 'vue'
import stores from '../stores/stores.mjs'
import { $t, styp } from '../app/util.mjs'

export default {
  name: 'PanelDialtk',

  props: { 
    min: Number, init: Number, titre: String
  },

  computed: {
  },

  data () {
    return {
    }
  },

  methods: {
    generer () { 
      this.$emit('ok', { m: this.m, ref: this.refx }) 
    }
  },

  setup (props) {
    const ui = stores.ui
    const init = toRef(props, 'init')
    const min = toRef(props, 'min')
    const mx = ref(('' + init.value) || '0')
    const m = ref()
    const diag = ref()
    const refx = ref('')

    function check (ap) {
      diag.value = ''
      m.value = parseInt(ap ? ap.replaceAll(',', '') : '0')
      if (m.value < min.value || m.value > 10000) diag.value = $t('TKer3')
    }

    watch(() => mx.value, (ap, av) => {
        check(ap)
      }
    )

    check(mx.value)
    
    return {
      ui, styp, mx, m, diag, refx
    }
  }

}
</script>

<style lang="sass" scoped>
@import '../css/app.sass'
.mh
  min-height: 1.5rem
.lg0
  width: 6rem
.lg1
  width: 8rem
.lg2
  width: 15rem
</style>
